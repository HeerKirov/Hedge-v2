import { defineComponent, PropType } from "vue"
import { useMessageBox } from "@/functions/message"
import { usePopupMenu } from "@/functions/service"
import { useFastObjectEndpoint } from "@/functions/utils/object-fast-endpoint"
import { Topic } from "@/functions/adapter-http/impl/topic"
import { VirtualRow } from "@/components/VirtualScrollView"
import { useTopicContext } from "./inject"

/**
 * 内容列表项视图。
 */
export default defineComponent({
    setup() {
        const messageBox = useMessageBox()
        const { dataEndpoint, detailMode, openDetailPane, closePane } = useTopicContext()

        const fastEndpoint = useFastObjectEndpoint({
            delete: httpClient => httpClient.topic.delete
        })

        const deleteItem = async (id: number) => {
            if(await messageBox.showYesNoMessage("确认", "确定要删除此项吗？此操作不可撤回。")) {
                if(await fastEndpoint.deleteData(id)) {
                    if(detailMode.value === id) closePane()
                    const index = dataEndpoint.operations.find(topic => topic.id === id)
                    if(index != undefined) dataEndpoint.operations.remove(index)
                }
            }
        }

        const popupmenu = usePopupMenu<number>([
            {type: "normal", label: "查看详情", click: openDetailPane},
            {type: "separator"},
            {type: "normal", label: "以此为父主题新建"},
            {type: "normal", label: "以此为模板新建"},
            {type: "separator"},
            {type: "normal", label: "删除此主题", click: deleteItem},
        ])

        return () => <div class="w-100 h-100">
            <VirtualRow rowHeight={33} padding={0} bufferSize={10} onUpdate={dataEndpoint.dataUpdate}
                        total={dataEndpoint.data.value.metrics.total} limit={dataEndpoint.data.value.metrics.limit} offset={dataEndpoint.data.value.metrics.offset}>
                <table class="table is-hoverable is-fullwidth">
                    <tbody>
                        {dataEndpoint.data.value.result.map(item => <Item key={item.id} value={item} selected={detailMode.value === item.id} onRightClick={() => popupmenu.popup(item.id)}/>)}
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
        value: {type: null as any as PropType<Topic>, required: true},
        selected: {type: Boolean, default: false}
    },
    emits: ["rightClick"],
    setup(props, { emit }) {
        const { openDetailPane } = useTopicContext()

        const click = () => openDetailPane(props.value.id)

        const rightClick = () => emit("rightClick")

        return () => <tr onClick={click} onContextmenu={rightClick} class={{'is-selected': props.selected}} style="height: 33px">
            <td class="is-width-50">
                <span class="mx-1">{props.value.name}</span>
                {(props.value.otherNames?.length || null) && <span class="has-text-grey">
                    ({props.value.otherNames.join(" / ")})
                </span>}
            </td>
            <td class="is-width-10">{(props.value.favorite || null) && <i class="fa fa-star has-text-danger"/>}</td>
            <td class="is-width-35">
                {props.value.annotations.map(annotation => <span class="tag mr-1">
                    <b>[</b><span class="mx-1">{annotation.name}</span><b>]</b>
                </span>)}
            </td>
            <td>
                {(props.value.score != null || null) && <>
                    <span>{props.value.score}</span>
                    <span class="icon"><i class="fa fa-star"/></span>
                </>}
            </td>
        </tr>
    }
})