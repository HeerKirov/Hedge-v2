import { defineComponent, markRaw } from "vue"
import { ImportImageGrid } from "@/layouts/data/IllustGrid"
import { ImportImage } from "@/functions/adapter-http/impl/import"
import { useFastObjectEndpoint } from "@/functions/utils/endpoints/object-fast-endpoint"
import { useMessageBox } from "@/functions/module/message-box"
import { usePopupMenu } from "@/functions/module/popup-menu"
import { useImportService } from "@/functions/api/import"
import { useImportContext } from "./inject"

export default defineComponent({
    setup() {
        const { list: { dataView, endpoint }, viewController: { fitType, columnNum }, selector: { selected, lastSelected } } = useImportContext()

        const updateSelected = (selectedValue: number[], lastSelectedValue: number | null) => {
            selected.value = selectedValue
            lastSelected.value = lastSelectedValue
        }

        const menu = useContextmenu()

        return () => dataView.data.value.metrics.total !== undefined && dataView.data.value.metrics.total <= 0
            ? <EmptyContent/>
            : <ImportImageGrid data={markRaw(dataView.data.value)} onDataUpdate={dataView.dataUpdate} draggable={true}
                               queryEndpoint={markRaw(endpoint.proxy)} fitType={fitType.value} columnNum={columnNum.value}
                               selected={selected.value} lastSelected={lastSelected.value} onSelect={updateSelected}
                               onRightClick={i => menu.popup(i)}/>
    }
})

const EmptyContent = defineComponent({
    setup() {
        const { openDialog } = useImportService()

        return () => <div class="w-100 h-100 has-text-centered relative">
            <p class="has-text-grey"><i>没有任何暂存导入项目</i></p>
            <button class="button is-success is-size-medium absolute center" onClick={openDialog}>
                <span class="icon"><i class="fa fa-plus"/></span><span>添加项目</span>
            </button>
        </div>
    }
})

function useContextmenu() {
    const messageBox = useMessageBox()
    const { list: { dataView, endpoint }, selector: { selected }, pane } = useImportContext()

    const menu = usePopupMenu<ImportImage>(() => [
        pane.paneMode.value === null
            ? { type: "checkbox", label: "显示信息预览", checked: false, click: i => pane.enableDetailPane(i.id) }
            : { type: "checkbox", label: "显示信息预览", checked: true, click: () => pane.disableDetailPane() },
        { type: "separator" },
        { type: "normal", label: "批量信息编辑", click: pane.openBatchUpdatePane },
        { type: "separator" },
        { type: "normal", label: "删除项目", click: i => deleteItem(i.id) },
    ])

    const fastEndpoint = useFastObjectEndpoint({
        delete: httpClient => httpClient.import.delete
    })

    const getEffectedItems = (id: number): number[] => {
        return selected.value.includes(id) ? selected.value : [id]
    }

    const deleteItem = async (id: number) => {
        if(selected.value.length === 0 || !selected.value.includes(id)) {
            if(await messageBox.showYesNoMessage("warn", "确定要删除此项吗？", "此操作不可撤回。")) {
                if(await fastEndpoint.deleteData(id)) {
                    const index = dataView.proxy.syncOperations.find(i => i.id === id)
                    if(index != undefined) dataView.proxy.syncOperations.remove(index)
                }
            }
        }else{
            const items = getEffectedItems(id)
            if(await messageBox.showYesNoMessage("warn", `确定要删除${items.length}个已选择项吗？`, "集合内的图像不会被删除。此操作不可撤回。")) {
                const ok = await Promise.all(items.map(id => fastEndpoint.deleteData(id)))
                if(ok.some(b => b)) {
                    endpoint.refresh()
                }
            }
        }
    }

    return menu
}
