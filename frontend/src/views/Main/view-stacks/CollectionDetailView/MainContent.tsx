import { defineComponent, markRaw } from "vue"
import TopBarLayout from "@/layouts/layouts/TopBarLayout"
import SideDrawer from "@/layouts/layouts/SideDrawer"
import MetaTagEditor from "@/layouts/drawers/MetaTagEditor"
import IllustGrid, { GridContextOperatorResult, useGridContextOperator } from "@/layouts/data/IllustGrid"
import { AddToCollectionDialog, useAddToCollectionDialog } from "@/layouts/dialogs/AddToCollectionDialog"
import { installExpandedInfoStorage } from "@/layouts/data/TagTree"
import { Illust } from "@/functions/adapter-http/impl/illust"
import { createProxySingleton, createSliceOfAll, createSliceOfList } from "@/functions/utils/endpoints/query-endpoint"
import { useDroppable } from "@/functions/feature/drag"
import { useDynamicPopupMenu } from "@/functions/module/popup-menu"
import TopBarContent from "./TopBarContent"
import { usePreviewContext, useMetadataEndpoint } from "./inject"

export default defineComponent({
    setup() {
        const { ui: { drawerTab } } = usePreviewContext()

        installExpandedInfoStorage()

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
            <AddToCollectionDialog/>
        </>
    }
})

const MetaTagEditorPanel = defineComponent({
    setup() {
        const { ui: { drawerTab }, data: { id } } = usePreviewContext()
        const { data, setData } = useMetadataEndpoint()

        const closeDrawerTab = () => drawerTab.value = undefined

        return () => <MetaTagEditor identity={id.value !== null ? {id: id.value!, type: "COLLECTION"} : null}
                                    tags={data.value?.tags ?? []}
                                    topics={data.value?.topics ?? []}
                                    authors={data.value?.authors ?? []}
                                    tagme={data.value?.tagme ?? []}
                                    setData={setData} onClose={closeDrawerTab}/>
    }
})

const ListView = defineComponent({
    setup() {
        const {
            images: {
                dataView, endpoint, scrollView,
                viewController: { fitType, columnNum },
                selector: { selected, lastSelected }
            },
            data: { toastRefresh, setTargetData, target }
        } = usePreviewContext()

        const updateSelected = (selectedValue: number[], lastSelectedValue: number | null) => {
            selected.value = selectedValue
            lastSelected.value = lastSelectedValue
        }

        const operator = useGridContextOperator<Illust>({
            dataView, endpoint, scrollView, selected,
            createSliceOfAll: createSliceOfAll,
            createSliceOfList: createSliceOfList,
            createSliceOfSingleton: createProxySingleton,
            splitToGenerateNewCollection: {
                refreshAfterCreated: true,
                afterCreated: toastRefresh //通知上层自己的变化
            },
            createAlbum: true,
            afterDeleted(index: number) {
                //由于从集合删除项目产生的变化不大，因此做一些精细的操作来更新上层数据
                setTargetData({childrenCount: target.value!.childrenCount! - 1})
                if(index === 0 && dataView.data.value.metrics.total! > 0) {
                    //移除首位的情况下，需要更新此collection的封面
                    const first = dataView.proxy.syncOperations.retrieve(0)
                    if(first !== undefined) setTargetData({thumbnailFile: first.thumbnailFile})
                }
            },
            afterRemovedFromCollection: toastRefresh //通知上层自己的变化
        })

        const menu = useContextmenu(operator)

        const dropEvents = useDropEvents()

        return () => <IllustGrid data={markRaw(dataView.data.value)} onDataUpdate={dataView.dataUpdate}
                                 draggable={true} {...dropEvents}
                                 queryEndpoint={markRaw(endpoint.proxy)} fitType={fitType.value} columnNum={columnNum.value}
                                 selected={selected.value} lastSelected={lastSelected.value} onSelect={updateSelected}
                                 onRightClick={i => menu.popup(i as Illust)} onDblClick={operator.clickToOpenDetail} onEnter={operator.enterToOpenDetail}/>
    }
})

function useContextmenu(operator: GridContextOperatorResult<Illust>) {
    //TODO 完成collection右键菜单的功能
    return useDynamicPopupMenu<Illust>(illust => [
        {type: "normal", label: "查看详情", click: illust => operator.clickToOpenDetail(illust.id)},
        {type: "separator"},
        {type: "normal", label: "在新窗口中打开", click: operator.openInNewWindow},
        {type: "normal", label: "显示信息预览"},
        {type: "separator"},
        illust.favorite
            ? {type: "normal", label: "取消标记为收藏", click: illust => operator.modifyFavorite(illust, false)}
            : {type: "normal", label: "标记为收藏", click: illust => operator.modifyFavorite(illust, true)},
        {type: "separator"},
        {type: "normal", label: "加入剪贴板"},
        {type: "separator"},
        {type: "normal", label: "拆分至新集合", click: operator.splitToGenerateNewCollection},
        {type: "normal", label: "创建画集", click: operator.createAlbum},
        {type: "normal", label: "创建关联组"},
        {type: "normal", label: "添加到文件夹"},
        {type: "normal", label: "添加到\"X\""},
        {type: "normal", label: "添加到临时文件夹"},
        {type: "separator"},
        {type: "normal", label: "导出"},
        {type: "separator"},
        {type: "normal", label: "删除项目", click: operator.deleteItem},
        {type: "normal", label: "从集合移除此项目", click: operator.removeItemFromCollection}
    ])
}

function useDropEvents() {
    const { data: { id }, images: { endpoint } } = usePreviewContext()
    const addToCollectionDialog = useAddToCollectionDialog()

    const { isDragover: _, ...dropEvents } = useDroppable("illusts", (illusts) => {
        if(id.value !== null) {
            addToCollectionDialog.addToCollection(illusts.map(i => i.id), id.value, () => endpoint.refresh())
        }
    })

    return dropEvents
}
