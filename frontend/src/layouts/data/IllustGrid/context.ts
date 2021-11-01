import { Ref } from "vue"
import { ScrollView } from "@/components/features/VirtualScrollView"
import { PaginationDataView, QueryEndpointInstance, QueryEndpointResult, SingletonDataView, SliceDataView } from "@/functions/utils/endpoints/query-endpoint"
import { Illust, IllustType } from "@/functions/adapter-http/impl/illust"
import { useCreatingCollectionDialog } from "@/layouts/dialogs/CreatingCollectionDialog"
import { useCreatingAlbumDialog } from "@/layouts/dialogs/CreatingAlbumDialog"
import { useFastObjectEndpoint } from "@/functions/utils/endpoints/object-fast-endpoint"
import { useNavigator } from "@/functions/feature/navigator"
import { useMessageBox } from "@/functions/module/message-box"
import { useToast } from "@/functions/module/toast"
import { useHttpClient } from "@/functions/app"
import { useViewStack } from "@/views/Main/view-stacks"
import { LocalDateTime } from "@/utils/datetime"

export interface SuitableIllust {
    id: number
    file: string
    thumbnailFile: string
    favorite: boolean
    orderTime: LocalDateTime
    type?: IllustType
    childrenCount?: number | null
}

interface GridContextOperatorOptions<T extends SuitableIllust> {
    /**
     * data view.
     */
    dataView: PaginationDataView<T>
    /**
     * endpoint.
     */
    endpoint: QueryEndpointResult<T>
    /**
     * 已选择项。
     */
    selected: Ref<number[]>
    /**
     * scroll view。
     */
    scrollView: Readonly<ScrollView>
    /**
     * 创建全局切片。在open all items时用到。
     */
    createSliceOfAll(instance: QueryEndpointInstance<T>): SliceDataView<Illust>
    /**
     * 创建列表切片。在open selected items时用到。
     */
    createSliceOfList(instance: QueryEndpointInstance<T>, indexList: number[]): SliceDataView<Illust>
    /**
     * 创建单例切片。在openCollectionDetail, clickToOpenDetail(..., true)时会用到。
     * 如果不提供此选项，那么上述两项功能不会生效。
     */
    createSliceOfSingleton?(instance: QueryEndpointInstance<T>, index: number): SingletonDataView<Illust>
    /**
     * 启用{createCollection}和功能。或者提供更多选项参数。
     * 要使用此功能，需要在上层组件{installCreatingCollectionDialog}。
     */
    createCollection?: boolean | {forceDialog?: boolean, refreshAfterCreated?: boolean, afterCreated?(collectionId: number): void}
    /**
     * 启用{splitToGenerateNewCollection}功能。
     */
    splitToGenerateNewCollection?: boolean | {refreshAfterCreated?: boolean, afterCreated?(collectionId: number): void}
    /**
     * 启用{createAlbum}功能。
     * 要使用此功能，需要在上层组件{installCreatingAlbumDialog}。
     */
    createAlbum?: boolean
    /**
     * 调用deleteItem后，附加的回调。
     */
    afterDeleted?(): void
}

export interface GridContextOperatorResult<T> {
    /**
     * 通过双击的方式打开详情页。
     * @param illustId illust id
     * @param openCollection 如果目标是集合，那么打开集合。
     */
    clickToOpenDetail(illustId: number, openCollection?: boolean): void
    /**
     * 通过选中回车的方式打开详情页。处理方式大致相同，不过没有openCollection模式，且在选中多项时从头开始浏览。
     * @param illustId
     */
    enterToOpenDetail(illustId: number): void
    /**
     * 直接打开集合详情页。
     */
    openCollectionDetail(illustId: number): void
    /**
     * 在新窗口打开此项目。
     * @param illust
     */
    openInNewWindow(illust: T): void
    /**
     * 更改favorite属性。
     */
    modifyFavorite(illust: T, favorite: boolean): void
    /**
     * 创建集合。选用的items列表是已选择项加上当前目标项。
     * 如果选择的项中存在集合，或存在已属于其他集合的图像，那么打开一个对话框以供判别。
     * - forceDialog: 无论有没有冲突，都打开对话框。
     * - refreshWhenCreated: 创建成功后，刷新endpoint。
     */
    createCollection(illust: T): void
    /**
     * 从当前集合中拆分出选择项来生成新集合。应该在集合详情页的列表中替代{createCollection}来调用。
     * 因为总是从现有集合中选取数据，因此它的作用是从现有集合拆分出一个新集合。
     */
    splitToGenerateNewCollection(illust: T): void
    /**
     * 创建album。选用的items列表是已选择项加上当前目标项。
     * 打开一个对话框，以供编辑项列表和填写基本信息。
     */
    createAlbum(illust: T): void
    /**
     * 删除项目。
     */
    deleteItem(illust: T): void
}

export function useGridContextOperator<T extends SuitableIllust>(options: GridContextOperatorOptions<T>): GridContextOperatorResult<T> {
    const toast = useToast()
    const messageBox = useMessageBox()
    const navigator = useNavigator()
    const httpClient = useHttpClient()
    const viewStacks = useViewStack()
    const { dataView, endpoint, scrollView, selected } = options
    const creatingCollection = options.createCollection ? useCreatingCollectionDialog() : null
    const creatingAlbum = options.createAlbum ? useCreatingAlbumDialog() : null

    const imageFastEndpoint = useFastObjectEndpoint({
        update: httpClient => httpClient.illust.image.update,
        delete: httpClient => httpClient.illust.image.delete
    })
    const collectionFastEndpoint = useFastObjectEndpoint({
        update: httpClient => httpClient.illust.collection.update,
        delete: httpClient => httpClient.illust.collection.delete
    })

    const openAll = (illustId: number) => {
        const currentIndex = dataView.proxy.syncOperations.find(i => i.id === illustId)
        if(currentIndex !== undefined) {
            const data = options.createSliceOfAll(endpoint.instance.value)
            viewStacks.openImageView(data, currentIndex, (index: number) => {
                //回调：导航到目标index的位置
                scrollView.navigateTo(index)
            })
        }
    }

    const openList = (selected: number[], currentIndex: number) => {
        const indexList = selected
            .map(selectedId => dataView.proxy.syncOperations.find(i => i.id === selectedId))
            .filter(index => index !== undefined) as number[]
        const data = options.createSliceOfList(endpoint.instance.value, indexList)

        viewStacks.openImageView(data, currentIndex, async (index: number) => {
            //回调：给出了目标index，回查data中此index的项，并找到此项现在的位置，导航到此位置
            const illust = await data.get(index)
            if(illust !== undefined) {
                const index = dataView.proxy.syncOperations.find(i => i.id === illust.id)
                if(index !== undefined) scrollView.navigateTo(index)
            }
        })
    }

    const clickToOpenDetail = (illustId: number, openCollection?: boolean) => {
        if(openCollection && options.createSliceOfSingleton) {
            //在按下option/alt键时，打开集合
            const index = dataView.proxy.syncOperations.find(i => i.id === illustId)
            if(index !== undefined) {
                const illust = dataView.proxy.syncOperations.retrieve(index)!
                if(illust.type === "COLLECTION") {
                    const data = options.createSliceOfSingleton(endpoint.instance.value, index)
                    viewStacks.openCollectionView(data, () => endpoint.refresh())
                    return
                }
            }
        }
        if(selected.value.length > 1) {
            //选择项数量大于1时，只显示选择项列表
            const currentIndex = selected.value.indexOf(illustId)
            if(currentIndex <= -1) {
                //特殊情况：在选择项之外的项上右键选择了预览。此时仍按全局显示
                openAll(illustId)
            }else{
                openList(selected.value, currentIndex)
            }
        }else{
            //否则显示全局
            openAll(illustId)
        }
    }

    const enterToOpenDetail = (illustId: number) => {
        if(selected.value.length > 1) {
            //选择项数量大于1时，只显示选择项列表，且进入模式是enter进入，默认不指定选择项，从头开始浏览
            openList(selected.value, 0)
        }else{
            //否则显示全局
            openAll(illustId)
        }
    }

    const openCollectionDetail = (illustId: number) => {
        if(options.createSliceOfSingleton) {
            const currentIndex = dataView.proxy.syncOperations.find(i => i.id === illustId)
            if(currentIndex !== undefined) {
                const illust = dataView.proxy.syncOperations.retrieve(currentIndex)!
                if(illust.type === "COLLECTION") {
                    const data = options.createSliceOfSingleton(endpoint.instance.value, currentIndex)
                    viewStacks.openCollectionView(data, () => endpoint.refresh())
                }else{
                    console.error(`Illust ${illust.id} is not a collection.`)
                }
            }
        }
    }

    const openInNewWindow = (illust: T) => {
        if(illust.type === "IMAGE") navigator.newWindow.preferences.image(illust.id)
        else navigator.newWindow.preferences.collection(illust.id)
    }

    const modifyFavorite = async (illust: T, favorite: boolean) => {
        //TODO 增加对selected项的处理
        const ok = illust.type === "IMAGE"
            ? await imageFastEndpoint.setData(illust.id, { favorite })
            : await collectionFastEndpoint.setData(illust.id, { favorite })

        if(ok) {
            const index = dataView.proxy.syncOperations.find(i => i.id === illust.id)
            if(index !== undefined) {
                dataView.proxy.syncOperations.modify(index, {...illust, favorite})
            }
        }
    }

    const createCollection = options.createCollection ? (illust: T) => {
        const items = selected.value.includes(illust.id) ? selected.value : [...selected.value, illust.id]

        const forceDialog = typeof options.createCollection === "object" && options.createCollection.forceDialog

        const refreshWhenCreated = typeof options.createCollection === "object" && options.createCollection.refreshAfterCreated
        const whenCreated = typeof options.createCollection === "object" && options.createCollection.afterCreated || undefined
        const onCreated = refreshWhenCreated || whenCreated ? (collectionId: number) => {
            if(refreshWhenCreated) endpoint.refresh()
            whenCreated?.(collectionId)
        } : undefined

        if(forceDialog) {
            creatingCollection!.createCollectionForceDialog(items, onCreated)
        }else{
            creatingCollection!.createCollection(items, onCreated)
        }
    } : () => {}

    const splitToGenerateNewCollection = options.splitToGenerateNewCollection ? async (illust: T) => {
        const refreshWhenCreated = typeof options.splitToGenerateNewCollection === "object" && options.splitToGenerateNewCollection.refreshAfterCreated
        const whenCreated = typeof options.splitToGenerateNewCollection === "object" && options.splitToGenerateNewCollection.afterCreated || undefined
        const onCreated = refreshWhenCreated || whenCreated ? (collectionId: number) => {
            //将所有项从当前数据视图中移除。然而query endpoint的设计不适合连续删除，因此更好的选择是直接刷新一下
            if(refreshWhenCreated) endpoint.refresh()
            whenCreated?.(collectionId)
        } : undefined

        if(await messageBox.showYesNoMessage("confirm", "确定要拆分生成新的集合吗？", "这些项将从当前集合中移除。")) {
            const images = selected.value.length > 0 ? [...selected.value] : [illust.id]
            const res = await httpClient.illust.collection.create({images})
            if(res.ok) {
                //创建成功后打开新集合的详情页面
                viewStacks.openCollectionView(res.data.id)
                onCreated?.(res.data.id)
            }else{
                toast.handleException(res.exception)
            }
        }
    } : async () => {}

    const createAlbum = options.createAlbum ? (illust: T) => {
        const items = selected.value.includes(illust.id) ? selected.value : [...selected.value, illust.id]
        creatingAlbum!.createAlbum(items)
    } : () => {}

    const deleteItem = async (illust: T) => {
        //TODO 添加对selected的处理

        if(illust.type === "IMAGE") {
            if(await messageBox.showYesNoMessage("warn", "确定要删除此项吗？", "此操作不可撤回。")) {
                const ok = await imageFastEndpoint.deleteData(illust.id)
                const index = dataView.proxy.syncOperations.find(i => i.id === illust.id)
                if(ok && index !== undefined) {
                    dataView.proxy.syncOperations.remove(index)
                    options.afterDeleted?.()
                }
            }
        }else{
            if(await messageBox.showYesNoMessage("warn", "确定要删除此集合吗？集合内的图像不会被删除。", "此操作不可撤回。")) {
                const ok = await collectionFastEndpoint.deleteData(illust.id)
                if(ok) {
                    //删除集合可能意味着内部图像拆分，必须刷新列表
                    endpoint.refresh()
                    if(options.afterDeleted) {
                        const index = dataView.proxy.syncOperations.find(i => i.id === illust.id)
                        if(index !== undefined) options.afterDeleted?.()
                    }
                }
            }
        }
    }

    return {
        clickToOpenDetail, enterToOpenDetail, openCollectionDetail, openInNewWindow, modifyFavorite,
        createCollection, splitToGenerateNewCollection, createAlbum,
        deleteItem
    }
}
