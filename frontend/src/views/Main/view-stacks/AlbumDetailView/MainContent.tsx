import { defineComponent, markRaw } from "vue"
import TopBarLayout from "@/layouts/layouts/TopBarLayout"
import SideDrawer from "@/layouts/layouts/SideDrawer"
import IllustGrid, { GridContextOperatorResult, useGridContextOperator } from "@/layouts/data/IllustGrid"
import MetaTagEditor from "@/layouts/drawers/MetaTagEditor"
import { AlbumImage } from "@/functions/adapter-http/impl/album"
import { createSliceOfAll, createSliceOfList } from "@/functions/utils/endpoints/query-endpoint"
import { useDynamicPopupMenu } from "@/functions/module/popup-menu"
import TopBarContent from "./TopBarContent"
import { usePreviewContext } from "./inject"

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
        const { ui: { drawerTab }, data: { id }, detailInfo } = usePreviewContext()

        const closeDrawerTab = () => drawerTab.value = undefined

        return () => <MetaTagEditor identity={id.value !== null ? {id: id.value!, type: "ALBUM"} : null}
                                    tags={detailInfo.data.value?.tags ?? []}
                                    topics={detailInfo.data.value?.topics ?? []}
                                    authors={detailInfo.data.value?.authors ?? []}
                                    tagme={[]} setData={detailInfo.setData} onClose={closeDrawerTab}/>
    }
})

const ListView = defineComponent({
    setup() {
        const {
            images: {
                dataView, endpoint, scrollView,
                viewController: { columnNum, fitType },
                selector: { selected, lastSelected }
            },
            data: { toastRefresh }
        } = usePreviewContext()

        const updateSelected = (selectedValue: number[], lastSelectedValue: number | null) => {
            selected.value = selectedValue
            lastSelected.value = lastSelectedValue
        }

        const operator = useGridContextOperator<AlbumImage>({
            dataView, endpoint, scrollView, selected,
            createSliceOfAll: instance => createSliceOfAll(instance, {
                to: data => ({...data, type: "IMAGE", childrenCount: null}),
                from: data => data
            }),
            createSliceOfList: (instance, indexList) => createSliceOfList(instance, indexList, {
                to: data => ({...data, type: "IMAGE", childrenCount: null}),
                from: data => data
            }),
            createCollection: {forceDialog: true},
            afterDeleted: toastRefresh, //TODO 删除图像是能优化的，对上层的影响仅限于target自身
            afterRemovedFromAlbum: toastRefresh //TODO 移除图像也是能优化的，对上层的影响仅限于target自身
        })

        const menu = useContextmenu(operator)

        return () => <IllustGrid data={markRaw(dataView.data.value)} onDataUpdate={dataView.dataUpdate} draggable={true} droppable={true}
                                 queryEndpoint={markRaw(endpoint.proxy)} fitType={fitType.value} columnNum={columnNum.value}
                                 selected={selected.value} lastSelected={lastSelected.value} onSelect={updateSelected}
                                 onRightClick={i => menu.popup(i as AlbumImage)} onDblClick={operator.clickToOpenDetail} onEnter={operator.enterToOpenDetail}/>
    }
})

function useContextmenu(operator: GridContextOperatorResult<AlbumImage>) {
    const { data: { id } } = usePreviewContext()
    //TODO 完成album images右键菜单的功能
    return useDynamicPopupMenu<AlbumImage>(image => [
        {type: "normal", label: "查看详情", click: image => operator.clickToOpenDetail(image.id)},
        {type: "separator"},
        {type: "normal", label: "在新窗口中打开", click: operator.openInNewWindow},
        {type: "normal", label: "显示信息预览"},
        {type: "separator"},
        image.favorite
            ? {type: "normal", label: "取消标记为收藏", click: image => operator.modifyFavorite(image, false)}
            : {type: "normal", label: "标记为收藏", click: image => operator.modifyFavorite(image, true)},
        {type: "separator"},
        {type: "normal", label: "加入剪贴板"},
        {type: "separator"},
        {type: "normal", label: "创建图像集合", click: operator.createCollection},
        {type: "normal", label: "创建关联组"},
        {type: "normal", label: "添加到文件夹"},
        {type: "normal", label: "添加到\"X\""},
        {type: "normal", label: "添加到临时文件夹"},
        {type: "separator"},
        {type: "normal", label: "导出"},
        {type: "separator"},
        {type: "normal", label: "删除项目", click: operator.deleteItem},
        {type: "normal", label: "从画集移除此项目", click: i => operator.removeItemFromAlbum(i, id.value!)}
    ])
}
