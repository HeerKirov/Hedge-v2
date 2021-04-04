import { defineComponent, inject, PropType } from "vue"
import { AnnotationTarget } from "@/functions/adapter-http/impl/annotations"
import { usePopupMenu } from "@/functions/service"
import { VirtualRow } from "@/components/VirtualScrollView"
import { TARGET_TYPE_ICON } from "./define"
import { annotationContextInjection } from "./inject"

/**
 * 内容列表项视图。
 */
export default defineComponent({
    setup() {
        const { dataEndpoint, detail } = inject(annotationContextInjection)!

        const popupmenu = usePopupMenu<number>([
            {type: "normal", label: "查看详情", click(id) {
                console.log("查看详情", id)
            }},
            {type: "separator"},
            {type: "normal", label: "以此注解为模板新建", click(id) {
                console.log("新建", id)
            }},
            {type: "separator"},
            {type: "normal", label: "删除此注解", click(id) {
                console.log("删除", id)
            }},
        ])

        return () => <div class="w-100 h-100">
            <VirtualRow rowHeight={33} padding={0} bufferSize={10} onUpdate={dataEndpoint.dataUpdate}
                        total={dataEndpoint.data.value.metrics.total} limit={dataEndpoint.data.value.metrics.limit} offset={dataEndpoint.data.value.metrics.offset}>
                <table class="table is-hoverable is-fullwidth">
                    <tbody>
                        {dataEndpoint.data.value.result.map(item => <Item key={item.id} {...item} selected={detail.value === item.id} onRightClick={() => popupmenu.popup(item.id)}/>)}
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
        canBeExported: {type: Boolean, required: true},
        selected: {type: Boolean, default: false}
    },
    emits: ["rightClick"],
    setup(props, { emit }) {
        const { detail } = inject(annotationContextInjection)!

        const click = () => { detail.value = props.id }

        const rightClick = () => emit("rightClick")

        return () => <tr onClick={click} onContextmenu={rightClick} class={{'is-selected': props.selected}}>
            <td class="is-width-50"><b class="ml-1">[</b><span class="mx-1">{props.name}</span><b>]</b></td>
            <td class="is-width-15">{(props.canBeExported || null) && <i class="fa fa-share-square is-danger"/>}</td>
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
            {(props.target.length > 0 ? props.target : ["TAG", "AUTHOR", "TOPIC"]).map(t => <i class={`fa fa-${TARGET_TYPE_ICON[t]} mr-2`}/>)}
        </span>
    }
})