import { computed, defineComponent, nextTick, PropType } from "vue"
import { VirtualRow } from "@/components/logicals/VirtualScrollView"
import { useMessageBox } from "@/services/module/message-box"
import { usePopupMenu } from "@/services/module/popup-menu"
import { SourceImage } from "@/functions/adapter-http/impl/source-image"
import { useFastObjectEndpoint } from "@/functions/endpoints/object-fast-endpoint"
import { useEditSourceImageService } from "@/layouts/globals/GlobalDialog"
import { useHttpClient } from "@/services/app"
import { datetime } from "@/utils/datetime"
import { useSourceImageContext, keyEqual, SourceKey } from "./inject"

export default defineComponent({
    setup() {
        const httpClient = useHttpClient()
        const messageBox = useMessageBox()
        const { list: { dataView, endpoint }, pane: { detailMode, openDetailPane, closePane } } = useSourceImageContext()
        const { edit } = useEditSourceImageService()

        const fastEndpoint = useFastObjectEndpoint({
            delete: httpClient => httpClient.sourceImage.delete
        })

        const deleteItem = async (key: SourceKey) => {
            const res = await httpClient.sourceImage.getRelatedImages(key)
            if(res.ok) {
                const relatedCount = res.data.length
                if(await messageBox.showYesNoMessage("warn", "确定要删除此项吗？" + (relatedCount > 0 ? `此项仍有${relatedCount}个关联的图库项目。` : ""), (relatedCount > 0 ? "删除会导致图库项目的来源信息清空。" : "") + "此操作不可撤回。")) {
                    if(await fastEndpoint.deleteData(key)) {
                        if(keyEqual(key, detailMode.value)) closePane()
                        const index = dataView.proxy.syncOperations.find(item => keyEqual(item, key))
                        if(index != undefined) dataView.proxy.syncOperations.remove(index)
                    }
                }
            }
        }

        const editItem = (key: SourceKey) => {
            edit(key, () => {
                endpoint.refresh()
                if(keyEqual(detailMode.value, key)) {
                    closePane()
                    nextTick(() => openDetailPane(key)).finally()
                }
            })
        }

        const popupmenu = usePopupMenu<SourceKey>([
            {type: "normal", label: "查看详情", click: openDetailPane},
            {type: "separator"},
            {type: "normal", label: "编辑", click: editItem},
            {type: "separator"},
            {type: "normal", label: "删除此项", click: deleteItem},
        ])

        return () => <div class="w-100 h-100">
            <VirtualRow rowHeight={33} padding={0} bufferSize={10} onUpdate={dataView.dataUpdate} {...dataView.data.value.metrics}>
                <table class="table is-hoverable is-fullwidth no-wrap">
                    <tbody>
                        {dataView.data.value.result.map(item => <Item key={`${item.source}-${item.sourceId}`} item={item} onRightClick={popupmenu.popup}/>)}
                    </tbody>
                </table>
            </VirtualRow>
        </div>
    }
})

const Item = defineComponent({
    props: {
        item: {type: Object as PropType<SourceImage>, required: true}
    },
    emits: {
        rightClick: (_: SourceKey) => true
    },
    setup(props, { emit }) {
        const { pane: { detailMode, openDetailPane } } = useSourceImageContext()

        const selected = computed(() => detailMode.value?.source === props.item.source && detailMode.value.sourceId === props.item.sourceId)

        const click = () => openDetailPane({...props.item})
        const rightClick = () => emit("rightClick", {...props.item})

        function description(item: SourceImage): string {
            return [
                item.tagCount > 0 ? `${item.tagCount}个标签` : null,
                item.poolCount > 0 ? `${item.poolCount}个集合` : null,
                item.relationCount > 0 ? `${item.relationCount}个关联` : null
            ].filter(i => i !== null).join(", ")
        }

        return () => <tr onClick={click} onContextmenu={rightClick} class={{"is-selected": selected.value}} style="height: 33px">
            <td class="is-width-20">{props.item.source}</td>
            <td class="is-width-20">{props.item.sourceTitle}</td>
            <td class="is-width-20">{props.item.sourceId}</td>
            <td class="is-width-20 has-text-grey"><i>{description(props.item)}</i></td>
            <td class="is-width-20 has-text-right">{datetime.toSimpleFormat(props.item.updateTime)}</td>
        </tr>
    }
})
