import { defineComponent, markRaw } from "vue"
import { ImportImageGrid } from "@/layouts/data/IllustGrid"
import { ImportImage } from "@/functions/adapter-http/impl/import"
import { useFastObjectEndpoint } from "@/functions/utils/endpoints/object-fast-endpoint"
import { useMessageBox } from "@/functions/module/message-box"
import { usePopupMenu } from "@/functions/module/popup-menu"
import { useImportContext } from "./inject"

export default defineComponent({
    setup() {
        const messageBox = useMessageBox()
        const { list: { dataView, endpoint }, viewController: { fitType, columnNum }, selector: { selected, lastSelected }, pane } = useImportContext()

        const updateSelected = (selectedValue: number[], lastSelectedValue: number | null) => {
            selected.value = selectedValue
            lastSelected.value = lastSelectedValue
        }

        const fastEndpoint = useFastObjectEndpoint({
            delete: httpClient => httpClient.import.delete
        })

        const deleteItem = async (id: number) => {
            if(await messageBox.showYesNoMessage("warn", "确定要删除此项吗？", "此操作不可撤回。")) {
                if(await fastEndpoint.deleteData(id)) {
                    if(pane.detailMode.value === id) pane.closePane()
                    const index = dataView.proxy.syncOperations.find(i => i.id === id)
                    if(index != undefined) dataView.proxy.syncOperations.remove(index)
                }
            }
        }

        const popupmenu = usePopupMenu<ImportImage>([
            {type: "normal", label: "查看详情", click: i => pane.openDetailPane(i.id)},
            {type: "separator"},
            {type: "normal", label: "删除此项目", click: i => deleteItem(i.id)},
        ])

        return () => <ImportImageGrid data={markRaw(dataView.data.value)} onDataUpdate={dataView.dataUpdate} draggable={true}
                                 queryEndpoint={markRaw(endpoint.proxy)} fitType={fitType.value} columnNum={columnNum.value}
                                 selected={selected.value} lastSelected={lastSelected.value} onSelect={updateSelected}
                                 onRightClick={i => popupmenu.popup(i)}/>
    }
})
