import { computed, defineComponent, PropType } from "vue"
import { TagTreeNode } from "@/functions/adapter-http/impl/tag"
import { useDraggable } from "@/functions/drag"

/**
 * 标签树的展示组件。用于显示一个标签树节点，同时附带一些标签信息。
 */
export default defineComponent({
    props: {
        value: {type: null as any as PropType<TagTreeNode>, required: true},
        color: String,
        draggable: Boolean
    },
    setup(props, { slots }) {
        let elementRef: Element | null = null

        const dragEvents = useDraggable("tag", computed(() => ({
            id: props.value.id,
            name: props.value.name,
            color: props.value.color
        })))

        return () => {
            elementRef = null
            const isAddr = props.value.type !== "TAG"
            const isSequenced = props.value.group === "SEQUENCE" || props.value.group === "FORCE_AND_SEQUENCE"
            const isForced = props.value.group === "FORCE" || props.value.group === "FORCE_AND_SEQUENCE"
            const isGroup = props.value.group !== "NO"

            return <a ref={el => elementRef = el as Element} class={["tag", props.color ? `is-${props.color}` : null, isAddr ? "is-light" : null]} draggable={props.draggable} {...dragEvents}>
                {isSequenced && <i class="fa fa-sort-alpha-down mr-1"/>}
                {isForced && <b class="mr-1">!</b>}
                {isGroup ? <>
                    <b class="mr-1">{'{'}</b>
                    {props.value.name}
                    <b class="ml-1">{'}'}</b>
                </> : props.value.name}
                {slots.default?.()}
            </a>
        }
    }
})
