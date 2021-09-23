import { defineComponent, markRaw, watch } from "vue"
import IllustGrid from "@/layouts/data/IllustGrid"
import { Illust } from "@/functions/adapter-http/impl/illust"
import { useNavigator } from "@/functions/feature/navigator"
import { createSliceOfAll, createSliceOfList, QueryEndpointInstance } from "@/functions/utils/endpoints/query-endpoint"
import { useFastObjectEndpoint } from "@/functions/utils/endpoints/object-fast-endpoint"
import { useDynamicPopupMenu } from "@/functions/module/popup-menu"
import { useViewStacks } from "../view-stacks"
import { useIllustContext } from "./inject"
import { useMessageBox } from "@/functions/module/message-box";

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

        const menu = useContextmenu(dataView.proxy, clickToOpenDetail)

        //TODO 测试代码，用后删掉
        watch(() => dataView.data.value.metrics.total, t => {
            if(t !== undefined) {
                clickToOpenDetail(23)
            }
        })

        return () => <IllustGrid data={markRaw(dataView.data.value)} onDataUpdate={dataView.dataUpdate}
                                 fitType={fitType.value} columnNum={columnNum.value}
                                 selected={selected.value} lastSelected={lastSelected.value} onSelect={updateSelected}
                                 queryEndpoint={markRaw(endpoint.proxy)}
                                 onRightClick={menu.popup} onDblClick={clickToOpenDetail} onEnter={enterToOpenDetail}/>
    }
})

function useContextmenu(endpoint: QueryEndpointInstance<Illust>, clickToOpenDetail: (id: number) => void) {
    const messageBox = useMessageBox()
    const navigator = useNavigator()
    const imageFastEndpoint = useFastObjectEndpoint({
        update: httpClient => httpClient.illust.image.update,
        delete: httpClient => httpClient.illust.image.delete
    })
    const collectionFastEndpoint = useFastObjectEndpoint({
        update: httpClient => httpClient.illust.image.update,
        delete: httpClient => httpClient.illust.image.delete
    })

    //TODO 完成illust右键菜单的功能
    const menu = useDynamicPopupMenu<Illust>(illust => [
        {type: "normal", label: "查看详情", click: illust => clickToOpenDetail(illust.id)},
        illust.type === "COLLECTION" ? {type: "normal", label: "查看集合详情"} : null,
        {type: "separator"},
        {type: "normal", label: "显示预览"},
        {type: "normal", label: "在新窗口中打开", click: openInNewWindow},
        {type: "separator"},
        illust.favorite
            ? {type: "normal", label: "取消标记为收藏", click: illust => switchFavorite(illust, false)}
            : {type: "normal", label: "标记为收藏", click: illust => switchFavorite(illust, true)},
        {type: "separator"},
        {type: "normal", label: "加入剪贴板"},
        {type: "separator"},
        {type: "normal", label: "创建集合"},
        {type: "normal", label: "创建画集"},
        {type: "normal", label: "创建关联组"},
        {type: "normal", label: "添加到文件夹"},
        {type: "normal", label: "添加到\"X\""},
        {type: "normal", label: "添加到临时文件夹"},
        {type: "separator"},
        {type: "normal", label: "导出"},
        {type: "separator"},
        {type: "normal", label: "删除项目", click: del}
    ])

    const openInNewWindow = (illust: Illust) => {
        if(illust.type === "IMAGE") navigator.newWindow.preferences.image(illust.id)
        else navigator.newWindow.preferences.collection(illust.id)
    }

    const switchFavorite = async (illust: Illust, favorite: boolean) => {
        const ok = illust.type === "IMAGE"
            ? await imageFastEndpoint.setData(illust.id, { favorite })
            : await collectionFastEndpoint.setData(illust.id, { favorite })

        if(ok) {
            const index = endpoint.syncOperations.find(i => i.id === illust.id)
            if(index !== undefined) {
                endpoint.syncOperations.modify(index, {...illust, favorite})
            }
        }
    }

    const del = async (illust: Illust) => {
        if(await messageBox.showYesNoMessage("warn", "确定要删除此项吗？", "此操作不可撤回。")) {
            const ok = illust.type === "IMAGE"
                ? await imageFastEndpoint.deleteData(illust.id)
                : await collectionFastEndpoint.deleteData(illust.id)

            if(ok) {
                const index = endpoint.syncOperations.find(i => i.id === illust.id)
                if(index !== undefined) {
                    endpoint.syncOperations.remove(index)
                }
            }
        }
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
