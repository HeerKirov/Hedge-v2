import { computed, defineComponent, PropType } from "vue"
import { AnnotationTarget } from "@/functions/adapter-http/impl/annotations"
import { useMessageBox } from "@/services/module/message-box"
import { usePopupMenu } from "@/services/module/popup-menu"
import { useFastObjectEndpoint } from "@/functions/endpoints/object-fast-endpoint"
import { VirtualRow } from "@/components/logicals/VirtualScrollView"
import { TARGET_TYPE_ICONS } from "@/definitions/annotation"
import { useAnnotationContext } from "./inject"

/**
 * 内容列表项视图。
 */
export default defineComponent({
    setup() {
        const messageBox = useMessageBox()
        const { dataView, detailMode, openCreatePane, openDetailPane, closePane } = useAnnotationContext()

        const fastEndpoint = useFastObjectEndpoint({
            delete: httpClient => httpClient.annotation.delete
        })

        const createByItem = (id: number) => {
            const index = dataView.proxy.syncOperations.find(annotation => annotation.id === id)
            if(index != undefined) {
                const annotation = dataView.proxy.syncOperations.retrieve(index)
                openCreatePane(annotation)
            }
        }

        const deleteItem = async (id: number) => {
            if(await messageBox.showYesNoMessage("warn", "确定要删除此项吗？", "此操作不可撤回。")) {
                if(await fastEndpoint.deleteData(id)) {
                    if(detailMode.value === id) closePane()
                    const index = dataView.proxy.syncOperations.find(annotation => annotation.id === id)
                    if(index != undefined) dataView.proxy.syncOperations.remove(index)
                }
            }
        }

        const popupmenu = usePopupMenu<number>([
            {type: "normal", label: "查看详情", click: openDetailPane},
            {type: "separator"},
            {type: "normal", label: "以此为模板新建", click: createByItem},
            {type: "separator"},
            {type: "normal", label: "删除此注解", click: deleteItem},
        ])

        return () => <div class="w-100 h-100">
            <VirtualRow rowHeight={33} padding={0} bufferSize={10} onUpdate={dataView.dataUpdate} {...dataView.data.value.metrics}>
                <table class="table is-hoverable is-fullwidth no-wrap">
                    <tbody>
                        {dataView.data.value.result.map(item => <Item key={item.id} {...item} onRightClick={popupmenu.popup}/>)}
                    </tbody>
                </table>
            </VirtualRow>
        </div>
    }
})

/**
 * 列表项视图中的项。
 */
const Item = defineComponent({
    props: {
        id: {type: Number, required: true},
        name: {type: String, required: true},
        target: {type: null as any as PropType<AnnotationTarget[]>, required: true},
        canBeExported: {type: Boolean, required: true}
    },
    emits: ["rightClick"],
    setup(props, { emit }) {
        const { openDetailPane, detailMode } = useAnnotationContext()

        const selected = computed(() => detailMode.value === props.id)

        const click = () => openDetailPane(props.id)

        const rightClick = () => emit("rightClick", props.id)

        return () => <tr onClick={click} onContextmenu={rightClick} class={{'is-selected': selected.value}} style="height: 33px">
            <td class="is-width-50"><b class="ml-1">[</b><span class="mx-1">{props.name}</span><b>]</b></td>
            <td class="is-width-15">{(props.canBeExported || null) && <i class="fa fa-share-square"/>}</td>
            <td class="is-width-35">
                <AnnotationTargetElement target={props.target}/>
            </td>
        </tr>
    }
})

const AnnotationTargetElement = defineComponent({
    props: {
        target: {type: null as any as PropType<AnnotationTarget[]>, required: true},
    },
    setup(props) {
        return () => <span>
            {(props.target.length > 0 ? props.target : ["TAG", "AUTHOR", "TOPIC"]).map(t => <i class={`fa fa-${TARGET_TYPE_ICONS[t]} mr-2`}/>)}
        </span>
    }
})
