import { defineComponent, markRaw } from "vue"
import IllustGrid from "@/layouts/data/IllustGrid"
import { Illust } from "@/functions/adapter-http/impl/illust"
import { createSliceOfAll, createSliceOfList } from "@/functions/utils/endpoints/query-endpoint"
import { useFastObjectEndpoint } from "@/functions/utils/endpoints/object-fast-endpoint"
import { useHttpClient } from "@/functions/app"
import { useToast } from "@/functions/module/toast"
import { useMessageBox } from "@/functions/module/message-box"
import { useDynamicPopupMenu } from "@/functions/module/popup-menu"
import { useNavigator } from "@/functions/feature/navigator"
import { useViewStacks } from "../view-stacks"
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

        const { clickToOpenDetail, enterToOpenDetail } = useOpenDetail()

        const menu = useContextmenu(clickToOpenDetail)

        return () => <IllustGrid data={markRaw(dataView.data.value)} onDataUpdate={dataView.dataUpdate}
                                 queryEndpoint={markRaw(endpoint.proxy)} fitType={fitType.value} columnNum={columnNum.value}
                                 selected={selected.value} lastSelected={lastSelected.value} onSelect={updateSelected}
                                 onRightClick={menu.popup} onDblClick={clickToOpenDetail} onEnter={enterToOpenDetail}/>
    }
})

function useContextmenu(clickToOpenDetail: (id: number) => void) {

    const navigator = useNavigator()
    const { switchFavorite, createCollection, deleteItem } = useContextOperator()

    //TODO 完成illust右键菜单的功能
    const menu = useDynamicPopupMenu<Illust>(illust => [
        {type: "normal", label: "查看详情", click: illust => clickToOpenDetail(illust.id)},
        illust.type === "COLLECTION" ? {type: "normal", label: "查看集合详情"} : null,
        {type: "separator"},
        {type: "normal", label: "显示信息预览"},
        {type: "normal", label: "在新窗口中打开", click: openInNewWindow},
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

function useOpenDetail() {
    const { dataView, endpoint, selector: { selected } } = useIllustContext()
    const viewStacks = useViewStacks()

    const openAll = (illustId: number) => {
        const currentIndex = dataView.proxy.syncOperations.find(i => i.id === illustId)
        if(currentIndex !== undefined) {
            const data = createSliceOfAll(endpoint.instance.value)
            viewStacks.openView({type: "image", data, currentIndex})
        }
    }

    const openList = (selected: number[], currentIndex: number) => {
        const indexList = selected
            .map(selectedId => dataView.proxy.syncOperations.find(i => i.id === selectedId))
            .filter(index => index !== undefined) as number[]
        const data = createSliceOfList(endpoint.instance.value, indexList)

        viewStacks.openView({type: "image", data, currentIndex})
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

    return {clickToOpenDetail, enterToOpenDetail}
}

function useContextOperator() {
    const messageBox = useMessageBox()
    const toast = useToast()
    const httpClient = useHttpClient()

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
        if(selected.value.length >= 0 || illustId !== undefined) {
            //TODO 这只是一个初始版本。后续需要：
            //      优化后端API，允许images列表中列入collectionId，含义为将这整个collection加入新collection。
            //      新增检测(需要后端支持)，如果images列表包含collection或已属于其他collection的image，则弹出一个modal，要求选择操作[创建新col]/[加入其中某个col]。
            const images = selected.value.length >= 0 ? selected.value : [illustId!]
            const res = await httpClient.illust.collection.create({images})
            if(res.ok) {
                //创建成功的情况下，刷新列表
                endpoint.refresh()
            }else if(res.exception) {
                toast.handleException(res.exception)
            }
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
