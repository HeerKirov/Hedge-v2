import { computed, defineComponent } from "vue"
import { VirtualRow } from "@/components/features/VirtualScrollView"
import { useMessageBox } from "@/functions/module/message-box"
import { usePopupMenu } from "@/functions/module/popup-menu"
import { useFastObjectEndpoint } from "@/functions/utils/endpoints/object-fast-endpoint"
import { useSourceImageContext, keyEqual, SourceKey } from "./inject"

export default defineComponent({
    setup() {
        const messageBox = useMessageBox()
        const { list: { dataView }, pane: { detailMode, openDetailPane, closePane } } = useSourceImageContext()

        const fastEndpoint = useFastObjectEndpoint({
            delete: httpClient => httpClient.sourceImage.delete
        })

        const deleteItem = async (key: SourceKey) => {
            //TODO 对related images项做出判断和警告
            if(await messageBox.showYesNoMessage("warn", "确定要删除此项吗？", "此操作不可撤回。")) {
                if(await fastEndpoint.deleteData(key)) {
                    if(keyEqual(key, detailMode.value)) closePane()
                    const index = dataView.proxy.syncOperations.find(item => keyEqual(item, key))
                    if(index != undefined) dataView.proxy.syncOperations.remove(index)
                }
            }
        }

        const popupmenu = usePopupMenu<SourceKey>([
            {type: "normal", label: "查看详情", click: openDetailPane},
            {type: "separator"},
            {type: "normal", label: "删除此项", click: deleteItem},
        ])

        return () => <div class="w-100 h-100">
            <VirtualRow rowHeight={33} padding={0} bufferSize={10} onUpdate={dataView.dataUpdate} {...dataView.data.value.metrics}>
                <table class="table is-hoverable is-fullwidth no-wrap">
                    <tbody>
                        {dataView.data.value.result.map(item => <Item key={`${item.source}-${item.sourceId}`} {...item} onRightClick={popupmenu.popup}/>)}
                    </tbody>
                </table>
            </VirtualRow>
        </div>
    }
})

const Item = defineComponent({
    props: {
        source: {type: String, required: true},
        sourceTitle: {type: String, required: true},
        sourceId: {type: Number, required: true}
    },
    emits: {
        rightClick: (_: SourceKey) => true
    },
    setup(props, { emit }) {
        const { pane: { detailMode, openDetailPane } } = useSourceImageContext()

        const selected = computed(() => detailMode.value?.source === props.source && detailMode.value.sourceId === props.sourceId)

        const click = () => openDetailPane({...props})
        const rightClick = () => emit("rightClick", {...props})

        return () => <tr onClick={click} onContextmenu={rightClick} class={{"is-selected": selected.value}} style="height: 33px">
            <td class="is-width-20">{props.source}</td>
            <td class="is-width-35">{props.sourceTitle}</td>
            <td class="is-width-45">{props.sourceId}</td>
        </tr>
    }
})
