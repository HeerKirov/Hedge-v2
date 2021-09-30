import { defineComponent, markRaw } from "vue"
import IllustGrid from "@/layouts/data/IllustGrid"
import { useCreatingCollectionDialog } from "@/layouts/dialogs/CreatingCollectionDialog"
import { Illust } from "@/functions/adapter-http/impl/illust"
import { createProxySingleton, createSliceOfAll, createSliceOfList } from "@/functions/utils/endpoints/query-endpoint"
import { useFastObjectEndpoint } from "@/functions/utils/endpoints/object-fast-endpoint"
import { useMessageBox } from "@/functions/module/message-box"
import { useDynamicPopupMenu } from "@/functions/module/popup-menu"
import { useNavigator } from "@/functions/feature/navigator"
import { useViewStack } from "../view-stacks"
import { useIllustContext } from "./inject"

export default defineComponent({
    setup() {
        const {
            dataView,
            endpoint,
            viewController: { fitType, columnNum },
            selector: { selected, lastSelected }
        } = useIllustContext()

        const updateSelected = (selectedValue: number[], lastSelectedValue: number | null) => {
            selected.value = selectedValue
            lastSelected.value = lastSelectedValue
        }

        const openMethod = useOpenMethod()

        const menu = useContextmenu(openMethod)

        return () => <IllustGrid data={markRaw(dataView.data.value)} onDataUpdate={dataView.dataUpdate}
                                 queryEndpoint={markRaw(endpoint.proxy)} fitType={fitType.value} columnNum={columnNum.value}
                                 selected={selected.value} lastSelected={lastSelected.value} onSelect={updateSelected}
                                 onRightClick={menu.popup} onDblClick={openMethod.clickToOpenDetail} onEnter={openMethod.enterToOpenDetail}/>
    }
})

function useContextmenu(openMethod: ReturnType<typeof useOpenMethod>) {

    const navigator = useNavigator()
    const { switchFavorite, createCollection, deleteItem } = useContextOperator()

    //TODO 完成illust右键菜单的功能
    const menu = useDynamicPopupMenu<Illust>(illust => [
        {type: "normal", label: "查看详情", click: illust => openMethod.clickToOpenDetail(illust.id)},
        illust.type === "COLLECTION" ? {type: "normal", label: "查看集合详情", click: openMethod.openCollectionDetail} : null,
        {type: "separator"},
        {type: "normal", label: "在新窗口中打开", click: openInNewWindow},
        {type: "normal", label: "显示信息预览"},
        {type: "separator"},
        illust.favorite
            ? {type: "normal", label: "取消标记为收藏", click: illust => switchFavorite(illust, false)}
            : {type: "normal", label: "标记为收藏", click: illust => switchFavorite(illust, true)},
        {type: "separator"},
        {type: "normal", label: "加入剪贴板"},
        {type: "separator"},
        {type: "normal", label: "创建图库项目集合", click: illust => createCollection(illust.id)},
        {type: "normal", label: "创建画集"},
        {type: "normal", label: "创建关联组"},
        {type: "normal", label: "添加到文件夹"},
        {type: "normal", label: "添加到\"X\""},
        {type: "normal", label: "添加到临时文件夹"},
        {type: "separator"},
        {type: "normal", label: "导出"},
        {type: "separator"},
        {type: "normal", label: illust.type === "COLLECTION" ? "删除集合项目" : "删除项目", click: deleteItem}
    ])

    const openInNewWindow = (illust: Illust) => {
        if(illust.type === "IMAGE") navigator.newWindow.preferences.image(illust.id)
        else navigator.newWindow.preferences.collection(illust.id)
    }

    return menu
}

function useOpenMethod() {
    const { dataView, endpoint, selector: { selected }, scrollView } = useIllustContext()
    const viewStacks = useViewStack()

    const onImageViewClose = (illustId: number) => {
        //image view关闭时，回调通知list view它最后访问的illustId，以使list view导航到相应的illust上
        const index = dataView.proxy.syncOperations.find(i => i.id === illustId)
        if(index !== undefined) scrollView.navigateTo(index)
    }

    const openAll = (illustId: number) => {
        const currentIndex = dataView.proxy.syncOperations.find(i => i.id === illustId)
        if(currentIndex !== undefined) {
            const data = createSliceOfAll(endpoint.instance.value)
            viewStacks.openImageView(data, currentIndex, onImageViewClose)
        }
    }

    const openList = (selected: number[], currentIndex: number) => {
        const indexList = selected
            .map(selectedId => dataView.proxy.syncOperations.find(i => i.id === selectedId))
            .filter(index => index !== undefined) as number[]
        const data = createSliceOfList(endpoint.instance.value, indexList)

        viewStacks.openImageView(data, currentIndex, onImageViewClose)
    }

    const clickToOpenDetail = (illustId: number) => {
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

    const openCollectionDetail = (illust: Illust) => {
        if(illust?.type === "COLLECTION") {
            const currentIndex = dataView.proxy.syncOperations.find(i => i.id === illust.id)
            if(currentIndex !== undefined) {
                const data = createProxySingleton(endpoint.instance.value, currentIndex)
                viewStacks.openCollectionView(data)
            }
        }else{
            console.error(`Illust ${illust.id} is not a collection.`)
        }
    }

    return {clickToOpenDetail, enterToOpenDetail, openCollectionDetail}
}

function useContextOperator() {
    const messageBox = useMessageBox()
    const creatingCollection = useCreatingCollectionDialog()

    const imageFastEndpoint = useFastObjectEndpoint({
        update: httpClient => httpClient.illust.image.update,
        delete: httpClient => httpClient.illust.image.delete
    })
    const collectionFastEndpoint = useFastObjectEndpoint({
        update: httpClient => httpClient.illust.collection.update,
        delete: httpClient => httpClient.illust.collection.delete
    })

    const { dataView, endpoint, selector: { selected } } = useIllustContext()

    const switchFavorite = async (illust: Illust, favorite: boolean) => {
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

    const createCollection = async (illustId?: number) => {
        if(selected.value.length >= 0) {
            creatingCollection.createCollection(selected.value, () => endpoint.refresh())
        }else if(illustId !== undefined) {
            creatingCollection.createCollection([illustId], () => endpoint.refresh())
        }
    }

    const deleteItem = async (illust: Illust) => {
        if(illust.type === "IMAGE") {
            if(await messageBox.showYesNoMessage("warn", "确定要删除此项吗？", "此操作不可撤回。")) {
                const ok = await imageFastEndpoint.deleteData(illust.id)

                if(ok) {
                    const index = dataView.proxy.syncOperations.find(i => i.id === illust.id)
                    if(index !== undefined) {
                        dataView.proxy.syncOperations.remove(index)
                    }
                }
            }
        }else{
            if(await messageBox.showYesNoMessage("warn", "确定要删除此集合吗？集合内的图像不会被删除。", "此操作不可撤回。")) {
                const ok = await collectionFastEndpoint.deleteData(illust.id)

                if(ok) {
                    //删除集合可能意味着内部图像拆分，必须刷新列表
                    endpoint.refresh()
                }
            }
        }
    }

    return {switchFavorite, createCollection, deleteItem}
}
