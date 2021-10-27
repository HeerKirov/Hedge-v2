import { defineComponent, markRaw } from "vue"
import IllustGrid, { GridContextOperatorResult, useGridContextOperator } from "@/layouts/data/IllustGrid"
import { Illust } from "@/functions/adapter-http/impl/illust"
import { createProxySingleton, createSliceOfAll, createSliceOfList } from "@/functions/utils/endpoints/query-endpoint"
import { useDynamicPopupMenu } from "@/functions/module/popup-menu"
import { useIllustContext } from "./inject"

export default defineComponent({
    setup() {
        const {
            dataView, endpoint, scrollView,
            viewController: { fitType, columnNum },
            selector: { selected, lastSelected }
        } = useIllustContext()

        const updateSelected = (selectedValue: number[], lastSelectedValue: number | null) => {
            selected.value = selectedValue
            lastSelected.value = lastSelectedValue
        }

        const operator = useGridContextOperator<Illust>({
            dataView, endpoint, scrollView, selected,
            createSliceOfAll: createSliceOfAll,
            createSliceOfList: createSliceOfList,
            createSliceOfSingleton: createProxySingleton,
            createCollection: {refreshAfterCreated: true},
            createAlbum: true
        })

        const menu = useContextmenu(operator)

        return () => <IllustGrid data={markRaw(dataView.data.value)} onDataUpdate={dataView.dataUpdate} draggable={true}
                                 queryEndpoint={markRaw(endpoint.proxy)} fitType={fitType.value} columnNum={columnNum.value}
                                 selected={selected.value} lastSelected={lastSelected.value} onSelect={updateSelected}
                                 onRightClick={i => menu.popup(i as Illust)} onDblClick={operator.clickToOpenDetail} onEnter={operator.enterToOpenDetail}/>
    }
})

function useContextmenu(operator: GridContextOperatorResult<Illust>) {
    //TODO 完成illust右键菜单的功能
    return useDynamicPopupMenu<Illust>(illust => [
        {type: "normal", label: "查看详情", click: i => operator.clickToOpenDetail(i.id)},
        (illust.type === "COLLECTION" || null) && {type: "normal", label: "查看集合详情", click: i => operator.openCollectionDetail(i.id)},
        {type: "separator"},
        {type: "normal", label: "在新窗口中打开", click: operator.openInNewWindow},
        {type: "normal", label: "显示信息预览"},
        {type: "separator"},
        illust.favorite
            ? {type: "normal", label: "取消标记为收藏", click: i => operator.modifyFavorite(i, false)}
            : {type: "normal", label: "标记为收藏", click: i => operator.modifyFavorite(i, true)},
        {type: "separator"},
        {type: "normal", label: "加入剪贴板"},
        {type: "separator"},
        {type: "normal", label: "创建图像集合", click: operator.createCollection},
        {type: "normal", label: "创建画集", click: operator.createAlbum},
        {type: "normal", label: "创建关联组"},
        {type: "normal", label: "添加到文件夹"},
        {type: "normal", label: "添加到\"X\""},
        {type: "normal", label: "添加到临时文件夹"},
        {type: "separator"},
        {type: "normal", label: "导出"},
        {type: "separator"},
        {type: "normal", label: illust.type === "COLLECTION" ? "删除集合项目" : "删除项目", click: operator.deleteItem}
    ])
}
