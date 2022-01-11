import { Ref } from "vue"
import { ScrollView } from "@/components/features/VirtualScrollView"
import { PaginationDataView, QueryEndpointInstance, QueryEndpointResult, SingletonDataView, SliceDataView } from "@/functions/utils/endpoints/query-endpoint"
import { Illust, IllustType, Tagme } from "@/functions/adapter-http/impl/illust"
import { useCreatingCollectionService } from "@/layouts/dialogs/CreatingCollection"
import { useCreatingAlbumService, useAddToFolderService, useCloneImageService } from "@/layouts/dialogs"
import { useFastObjectEndpoint } from "@/functions/utils/endpoints/object-fast-endpoint"
import { useRouterNavigator } from "@/functions/feature/router"
import { useMessageBox } from "@/functions/module/message-box"
import { useToast } from "@/functions/module/toast"
import { useHttpClient } from "@/functions/app"
import { useViewStack } from "@/layouts/view-stacks"
import { LocalDateTime } from "@/utils/datetime"

export interface SuitableIllust {
    id: number
    file: string
    thumbnailFile: string
    favorite: boolean
    orderTime: LocalDateTime
    type?: IllustType
    childrenCount?: number | null
    tagme: Tagme[]
    score: number | null
    source: string | null
    sourceId: number | null
    sourcePart: number | null
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
     * 启用{addToFolder}功能。
     */
    addToFolder?: boolean
    /**
     * 启用{cloneImage}功能。
     */
    cloneImage?: boolean
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
     * 创建album。打开一个对话框，以供编辑项列表和填写基本信息。
     */
    createAlbum(illust: T): void
    /**
     * 添加到目录。打开一个对话框，以选择要添加到的目录。
     * @param illust
     */
    addToFolder(illust: T): void
    /**
     * 打开对话框，执行属性克隆操作。将选择项放入from和to。
     */
    cloneImage(illust: T): void
    /**
     * 删除项目。
     */
    deleteItem(illust: T): void
    /**
     * 获得当前操作中，应该受到影响的对象id列表。此方法被提供给外部实现的其他函数，用于和context内的选择行为统一。
     * 选择行为指：当存在选中项时，在选择项之外右键将仅使用右键项而不包括选择项。它需要影响那些有多项目操作的行为。
     */
    getEffectedItems(illust: T): number[]
}

export function useGridContextOperator<T extends SuitableIllust>(options: GridContextOperatorOptions<T>): GridContextOperatorResult<T> {
    const toast = useToast()
    const messageBox = useMessageBox()
    const navigator = useRouterNavigator()
    const httpClient = useHttpClient()
    const viewStacks = useViewStack()
    const { dataView, endpoint, scrollView, selected } = options
    const creatingCollectionService = options.createCollection ? useCreatingCollectionService() : null
    const creatingAlbumService = options.createAlbum ? useCreatingAlbumService() : null
    const addToFolderService = options.addToFolder ? useAddToFolderService() : null
    const cloneImageService = options.cloneImage ? useCloneImageService() : null

    const commonFastEndpoint = useFastObjectEndpoint({
        update: httpClient => httpClient.illust.update,
        delete: httpClient => httpClient.illust.delete
    })

    const getEffectedItems = (illust: T): number[] => {
        return selected.value.includes(illust.id) ? selected.value : [illust.id]
    }

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
        if(illust.type === "IMAGE") {
            const imageIds = getEffectedItems(illust)
            const currentIndex = imageIds.indexOf(illust.id)
            navigator.newWindow({routeName: "Preview", params: { type: "image", imageIds, currentIndex}})
        }else{
            navigator.newWindow({routeName: "Preview", params: {type: "collection", collectionId: illust.id}})
        }
    }

    const modifyFavorite = async (illust: T, favorite: boolean) => {
        const items = getEffectedItems(illust)

        for (const itemId of items) {
            const ok = await commonFastEndpoint.setData(itemId, { favorite })
            if(ok) {
                const index = dataView.proxy.syncOperations.find(i => i.id === itemId)
                if(index !== undefined) {
                    const illust = dataView.proxy.syncOperations.retrieve(index)!
                    dataView.proxy.syncOperations.modify(index, {...illust, favorite})
                }
            }
        }
    }

    const createCollection = options.createCollection ? (illust: T) => {
        const items = getEffectedItems(illust)

        const forceDialog = typeof options.createCollection === "object" && options.createCollection.forceDialog

        const refreshWhenCreated = typeof options.createCollection === "object" && options.createCollection.refreshAfterCreated
        const whenCreated = typeof options.createCollection === "object" && options.createCollection.afterCreated || undefined
        const onCreated = refreshWhenCreated || whenCreated ? (collectionId: number, newCollection: boolean) => {
            if(refreshWhenCreated) endpoint.refresh()
            whenCreated?.(collectionId)
            toast.toast(newCollection ? "已创建" : "已合并", "success",  newCollection ? "已创建新集合。" : "已将图像合并至指定集合。")
        } : (_, newCollection: boolean) => {
            toast.toast(newCollection ? "已创建" : "已合并", "success",  newCollection ? "已创建新集合。" : "已将图像合并至指定集合。")
        }

        if(forceDialog) {
            creatingCollectionService!.createCollectionForceDialog(items, onCreated)
        }else{
            creatingCollectionService!.createCollection(items, onCreated)
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
        const items = getEffectedItems(illust)
        creatingAlbumService!.createAlbum(items, () => toast.toast("已创建", "success", "已创建新画集。"))
    } : () => {}

    const addToFolder = options.addToFolder ? (illust: T) => {
        const items = getEffectedItems(illust)
        addToFolderService!.addToFolder(items, () => toast.toast("已添加", "success", "已将图像添加到指定目录。"))
    } : () => {}

    const deleteItem = async (illust: T) => {
        if(selected.value.length === 0 || !selected.value.includes(illust.id)) {
            if(illust.type === "IMAGE") {
                if(await messageBox.showYesNoMessage("warn", "确定要删除此项吗？", "此操作不可撤回。")) {
                    const ok = await commonFastEndpoint.deleteData(illust.id)
                    const index = dataView.proxy.syncOperations.find(i => i.id === illust.id)
                    if(ok && index !== undefined) {
                        dataView.proxy.syncOperations.remove(index)
                        options.afterDeleted?.()
                    }
                }
            }else{
                if(await messageBox.showYesNoMessage("warn", "确定要删除此集合吗？集合内的图像不会被删除。", "此操作不可撤回。")) {
                    const ok = await commonFastEndpoint.deleteData(illust.id)
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
        }else{
            const items = getEffectedItems(illust)
            if(await messageBox.showYesNoMessage("warn", `确定要删除${items.length}个已选择项吗？`, "集合内的图像不会被删除。此操作不可撤回。")) {
                const ok = await Promise.all(items.map(id => commonFastEndpoint.deleteData(id)))
                if(ok.some(b => b)) {
                    endpoint.refresh()
                    options.afterDeleted?.()
                }
            }
        }
    }

    const cloneImage = options.cloneImage ? async (illust: T) => {
        const items = getEffectedItems(illust)
        if(items.length > 2) {
            toast.toast("选择项过多", "warning", "选择项过多。属性克隆中，请使用1或2个选择项。")
            return
        }
        cloneImageService!.clone({from: items[0], to: items.length >= 2 ? items[1] : undefined}, (from, _, deleted) => {
            if(deleted) {
                const index = dataView.proxy.syncOperations.find(i => i.id === from)
                if(index !== undefined) {
                    dataView.proxy.syncOperations.remove(index)
                }
                toast.toast("完成", "success", "已完成属性克隆。源图像已删除。")
            }else{
                toast.toast("完成", "success", "已完成属性克隆。")
            }
        })
    } : () => {}

    return {
        clickToOpenDetail, enterToOpenDetail, openCollectionDetail, openInNewWindow, modifyFavorite,
        createCollection, splitToGenerateNewCollection, createAlbum, addToFolder, cloneImage,
        deleteItem, getEffectedItems
    }
}
