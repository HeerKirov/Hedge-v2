import { defineComponent, markRaw } from "vue"
import { ImportImageGrid, ImportImageRowList } from "@/layouts/data/Dataset"
import { ImportImage } from "@/functions/adapter-http/impl/import"
import { useFastObjectEndpoint } from "@/functions/utils/endpoints/object-fast-endpoint"
import { useMessageBox } from "@/functions/module/message-box"
import { usePopupMenu } from "@/functions/module/popup-menu"
import { useImportService } from "@/functions/api/import"
import { useImportContext } from "./inject"

export default defineComponent({
    setup() {
        const { list: { dataView, endpoint }, listController: { viewMode, fitType, columnNum }, selector: { selected, lastSelected }, pane } = useImportContext()

        const updateSelected = (selectedValue: number[], lastSelectedValue: number | null) => {
            selected.value = selectedValue
            lastSelected.value = lastSelectedValue
        }

        const menu = useContextmenu()

        return () => dataView.data.value.metrics.total !== undefined && dataView.data.value.metrics.total <= 0 ? <EmptyContent/>
            : viewMode.value === "grid" ? <ImportImageGrid data={markRaw(dataView.data.value)} onDataUpdate={dataView.dataUpdate} draggable={true}
                               queryEndpoint={markRaw(endpoint.proxy)} fitType={fitType.value} columnNum={columnNum.value} showSelectCount={!pane.visible.value}
                               selected={selected.value} lastSelected={lastSelected.value} onSelect={updateSelected} onRightClick={i => menu.popup(i)}/>
            : <ImportImageRowList data={markRaw(dataView.data.value)} onDataUpdate={dataView.dataUpdate} draggable={true}
                                  queryEndpoint={markRaw(endpoint.proxy)} showSelectCount={!pane.visible.value}
                                  selected={selected.value} lastSelected={lastSelected.value} onSelect={updateSelected} onRightClick={i => menu.popup(i)}/>
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
        { type: "checkbox", label: "显示信息预览", checked: pane.visible.value, click: () => pane.visible.value = !pane.visible.value },
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
            if(await messageBox.showYesNoMessage("warn", `确定要删除${items.length}个已选择项吗？`, "此操作不可撤回。")) {
                const ok = await Promise.all(items.map(id => fastEndpoint.deleteData(id)))
                if(ok.some(b => b)) {
                    endpoint.refresh()
                }
            }
        }
    }

    return menu
}
