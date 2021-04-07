import { defineComponent, PropType } from "vue"
import { useMessageBox } from "@/functions/message"
import { usePopupMenu } from "@/functions/service"
import { useFastObjectEndpoint } from "@/functions/utils/object-fast-endpoint"
import { Topic, TopicType } from "@/functions/adapter-http/impl/topic"
import { VirtualRow } from "@/components/VirtualScrollView"
import { useTopicContext } from "../inject"
import style from "./style.module.scss"

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
            {type: "normal", label: "新建子主题"},
            {type: "normal", label: "以此为模板新建"},
            {type: "separator"},
            {type: "normal", label: "删除此主题", click: deleteItem},
        ])

        return () => <div class="w-100 h-100">
            <VirtualRow rowHeight={33} padding={0} bufferSize={10} onUpdate={dataEndpoint.dataUpdate}
                        total={dataEndpoint.data.value.metrics.total} limit={dataEndpoint.data.value.metrics.limit} offset={dataEndpoint.data.value.metrics.offset}>
                <table class="table is-fullwidth no-wrap">
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

        //TODO 确定title颜色
        //TODO 为了在交互上与annotation有区分，topic list的设计样式要和table不一样，需要更向author靠拢一点。
        return () => <tr onClick={click} onContextmenu={rightClick} style="height: 50px">
            <td class="is-width-50">
                <span>{props.value.name}</span>
                {(props.value.otherNames?.length || null) && <p class="has-text-grey">
                    ({generateOtherNames(props.value.otherNames)})
                </p>}
            </td>
            <td class="is-width-5">{(props.value.favorite || null) && <i class="fa fa-heart has-text-danger"/>}</td>
            <td>{((props.value.type !== "UNKNOWN") || null) && TOPIC_TYPE_TAG[props.value.type]}</td>
            <td class="is-width-35">
                {/*控制标签的数量*/}
                {props.value.keywords.map(keyword => <span class="tag mr-1">{keyword}</span>)}
                {props.value.annotations.map(annotation => <span class="tag mr-1">
                    <b>[</b><span class="mx-1">{annotation.name}</span><b>]</b>
                </span>)}
            </td>
            <td class="is-width-5">
                {(props.value.score || null) && <>
                    <span>{props.value.score}</span>
                    <span class="icon ml-1"><i class="fa fa-star"/></span>
                </>}
            </td>
            <td class="is-width-5">
                {props.value.count ? `${props.value.count}项` : null}
            </td>
        </tr>
    }
})

function generateOtherNames(otherNames: string[]): string {
    const origin = otherNames.join(" / ")
    if(origin.length >= 64) {
        return origin.substr(0, 64) + "..."
    }
    return origin
}

const TOPIC_TYPE_TAG: {[key in Exclude<TopicType, "UNKNOWN">]: JSX.Element} = {
    "COPYRIGHT": <><i class="fa fa-copyright mr-1"/><span class="mr-2">版权方</span></>,
    "WORK": <><i class="fa fa-bookmark mr-1"/><span class="mr-2">作品</span></>,
    "CHARACTER": <><i class="fa fa-user-ninja mr-1"/><span class="mr-2">角色</span></>
}