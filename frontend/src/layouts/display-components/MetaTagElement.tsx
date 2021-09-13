import { defineComponent, h, PropType, toRef } from "vue"
import { MetaTagTypes, MetaTagValues, SimpleAuthor, SimpleTopic } from "@/functions/adapter-http/impl/all"
import { AUTHOR_TYPE_ICONS } from "@/definitions/author"
import { TOPIC_TYPE_ICONS } from "@/definitions/topic"
import { useDraggable } from "@/functions/drag"

/**
 * 通用的显示元数据标签的组件。用统一的深色标签+icon展示来自SimpleXXX的元数据。
 */
export const MetaTagElement = defineComponent({
    props: {
        type: {type: String as PropType<MetaTagTypes>, required: true},
        value: {type: Object as PropType<MetaTagValues>, required: true},
        draggable: Boolean,
        clickable: Boolean,
        wrappedByDiv: Boolean
    },
    setup(props, { slots }) {
        const type = toRef(props, "type")
        const data = toRef(props, "value")
        const dragEvents = useDraggable(type, data)

        function renderElement() {
            const icon = props.type === "author" ? AUTHOR_TYPE_ICONS[(props.value as SimpleAuthor).type] : props.type === "topic" ? TOPIC_TYPE_ICONS[(props.value as SimpleTopic).type] : undefined

            return h(props.clickable ? "a" : "span", {
                "class": `tag is-${props.value.color}`,
                "draggable": props.draggable,
                ...dragEvents
            }, [
                slots.frontOfTag?.(),
                icon && <i class={`fa fa-${icon} mr-1`}/>,
                props.value.name,
                slots.backOfTag?.()
            ])
        }

        return () => props.wrappedByDiv ? <div>
            {slots.frontOfWrap?.()}
            {renderElement()}
            {slots.backOfWrap?.()}
        </div> : renderElement()
    }
})
