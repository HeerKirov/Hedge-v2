import { defineComponent, markRaw, watch } from "vue"
import IllustGrid from "@/layouts/data/IllustGrid"
import { Illust } from "@/functions/adapter-http/impl/illust"
import { useDynamicPopupMenu } from "@/functions/module"
import { useViewStacks } from "../ViewStacks"
import { useIllustContext } from "./inject"

export default defineComponent({
    setup() {
        const {
            dataView,
            endpoint,
            viewController: { fitType, columnNum },
            selector: { selected, lastSelected }
        } = useIllustContext()

        const viewStacks = useViewStacks()

        const emitSelect = (selectedValue: number[], lastSelectedValue: number | null) => {
            selected.value = selectedValue
            lastSelected.value = lastSelectedValue
        }

        //TODO 完成菜单的功能
        const menu = useDynamicPopupMenu<Illust>(illust => [
            {type: "normal", label: "查看详情", click: illust => openDetail(illust.id)},
            illust.type === "COLLECTION" ? {type: "normal", label: "查看集合详情"} : null,
            {type: "separator"},
            {type: "normal", label: "显示预览"},
            {type: "normal", label: "在新窗口中打开"},
            {type: "separator"},
            illust.favorite
                ? {type: "normal", label: "取消标记为收藏"}
                : {type: "normal", label: "标记为收藏"},
            {type: "separator"},
            {type: "normal", label: "加入剪贴板"},
            {type: "separator"},
            {type: "normal", label: "创建集合"},
            {type: "normal", label: "创建画集"},
            {type: "normal", label: "添加到文件夹"},
            {type: "normal", label: "添加到\"X\""},
            {type: "normal", label: "添加到临时文件夹"},
            {type: "separator"},
            {type: "normal", label: "导出"},
            {type: "separator"},
            {type: "normal", label: "删除项目"}
        ])

        const openDetail = (illustId: number) => {
            if(selected.value.length > 1) {
                //选择项数量大于1时，只显示选择项列表
                const data = selected.value
                    .map(selectedId => dataView.proxy.syncOperations.find(i => i.id === selectedId))
                    .filter(index => index !== undefined)
                    .map(index => dataView.proxy.syncOperations.retrieve(index!!)!!)
                const currentIndex = data.findIndex(i => i.id === illustId)
                if(currentIndex === -1) {
                    //特殊情况：在选择项之外的项上右键选择了预览。此时仍按全局显示
                    const currentIndex = dataView.proxy.syncOperations.find(i => i.id === illustId)
                    if(currentIndex !== undefined) {
                        viewStacks.openView({type: "image", data: endpoint.instance.value, currentIndex})
                    }
                    return
                }
                viewStacks.openView({type: "image", data, currentIndex})
            }else{
                //否则显示全局
                const currentIndex = dataView.proxy.syncOperations.find(i => i.id === illustId)
                if(currentIndex !== undefined) {
                    viewStacks.openView({type: "image", data: endpoint.instance.value, currentIndex})
                }
            }

        }

        //TODO test
        watch(() => dataView.data.value.metrics.total, t => {
            if(t !== undefined) {
                openDetail(5)
            }
        })

        return () => <IllustGrid data={markRaw(dataView.data.value)} onDataUpdate={dataView.dataUpdate}
                                 fitType={fitType.value} columnNum={columnNum.value}
                                 selected={selected.value} lastSelected={lastSelected.value} onSelect={emitSelect}
                                 queryEndpoint={markRaw(endpoint.proxy)}
                                 onRightClick={menu.popup} onDblClick={openDetail}/>
    }
})
