import { defineComponent, markRaw } from "vue"
import TopBarLayout from "@/layouts/layouts/TopBarLayout"
import SideDrawer from "@/layouts/layouts/SideDrawer"
import IllustGrid from "@/layouts/data/IllustGrid"
import MetaTagEditor from "@/layouts/drawers/MetaTagEditor"
import TopBarContent from "./TopBarContent"
import { Illust } from "@/functions/adapter-http/impl/illust"
import { createSliceOfAll, createSliceOfList } from "@/functions/utils/endpoints/query-endpoint"
import { useFastObjectEndpoint } from "@/functions/utils/endpoints/object-fast-endpoint"
import { useNavigator } from "@/functions/feature/navigator"
import { useDynamicPopupMenu } from "@/functions/module/popup-menu"
import { useMessageBox } from "@/functions/module/message-box"
import { useViewStack } from "@/views/Main/view-stacks"
import { usePreviewContext, useMetadataEndpoint } from "./inject"

export default defineComponent({
    setup() {
        const { ui: { drawerTab } } = usePreviewContext()

        const closeDrawerTab = () => drawerTab.value = undefined

        const topBarLayoutSlots = {
            topBar() { return <TopBarContent/> },
            default() { return <ListView/> }
        }
        const sideDrawerSlots = {
            "metaTag"() { return <MetaTagEditorPanel/> }
        }
        return () => <>
            <TopBarLayout v-slots={topBarLayoutSlots}/>
            <SideDrawer tab={drawerTab.value} onClose={closeDrawerTab} v-slots={sideDrawerSlots}/>
        </>
    }
})

const MetaTagEditorPanel = defineComponent({
    setup() {
        const { ui: { drawerTab } } = usePreviewContext()
        const { data, setData } = useMetadataEndpoint()

        const closeDrawerTab = () => drawerTab.value = undefined

        return () => <MetaTagEditor tags={data.value?.tags ?? []}
                                    topics={data.value?.topics ?? []}
                                    authors={data.value?.authors ?? []}
                                    tagme={data.value?.tagme ?? []}
                                    setData={setData} onClose={closeDrawerTab}/>
    }
})

const ListView = defineComponent({
    setup() {
        const {
            dataView,
            endpoint,
            viewController: { fitType, columnNum },
            selector: { selected, lastSelected }
        } = usePreviewContext().images

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
    const { switchFavorite, deleteItem } = useContextOperator()

    //TODO 完成collection右键菜单的功能
    const menu = useDynamicPopupMenu<Illust>(illust => [
        {type: "normal", label: "查看详情", click: illust => openMethod.clickToOpenDetail(illust.id)},
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
        {type: "normal", label: "拆分创建新集合"},
        {type: "normal", label: "创建画集"},
        {type: "normal", label: "创建关联组"},
        {type: "normal", label: "添加到文件夹"},
        {type: "normal", label: "添加到\"X\""},
        {type: "normal", label: "添加到临时文件夹"},
        {type: "separator"},
        {type: "normal", label: "导出"},
        {type: "separator"},
        {type: "normal", label: "删除项目", click: deleteItem},
        {type: "normal", label: "从集合移除此项目"}
    ])

    const openInNewWindow = (illust: Illust) => {
        if(illust.type === "IMAGE") navigator.newWindow.preferences.image(illust.id)
        else navigator.newWindow.preferences.collection(illust.id)
    }

    return menu
}

function useOpenMethod() {
    const { dataView, endpoint, selector: { selected }, scrollView } = usePreviewContext().images
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

    return {clickToOpenDetail, enterToOpenDetail}
}

function useContextOperator() {
    const messageBox = useMessageBox()

    const imageFastEndpoint = useFastObjectEndpoint({
        update: httpClient => httpClient.illust.image.update,
        delete: httpClient => httpClient.illust.image.delete
    })
    const collectionFastEndpoint = useFastObjectEndpoint({
        update: httpClient => httpClient.illust.collection.update,
        delete: httpClient => httpClient.illust.collection.delete
    })

    const { dataView, endpoint, selector: { selected } } = usePreviewContext().images

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

    const deleteItem = async (illust: Illust) => {
        if(await messageBox.showYesNoMessage("warn", "确定要删除此项吗？", "此操作不可撤回。")) {
            const ok = await imageFastEndpoint.deleteData(illust.id)

            if(ok) {
                const index = dataView.proxy.syncOperations.find(i => i.id === illust.id)
                if(index !== undefined) {
                    dataView.proxy.syncOperations.remove(index)
                }
            }
        }
    }

    return {switchFavorite, deleteItem}
}
