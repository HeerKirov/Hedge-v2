import { ComponentPublicInstance, computed, defineComponent, PropType, toRef } from "vue"
import { MetaTagTypes, MetaTagValues, SimpleAuthor, SimpleTopic } from "@/functions/adapter-http/impl/all"
import { SimpleAnnotation } from "@/functions/adapter-http/impl/annotations"
import { IsGroup, TagType } from "@/functions/adapter-http/impl/tag"
import { AUTHOR_TYPE_ICONS } from "@/definitions/author"
import { TOPIC_TYPE_ICONS } from "@/definitions/topic"
import { useDraggable } from "@/functions/drag"
import { arrays } from "@/utils/collections"

/**
 * 通用的显示元数据标签的组件。用统一的深色标签+icon展示来自SimpleXXX的元数据。
 * 展示的信息包括名称、颜色、类型。
 */
export const SimpleMetaTagElement = defineComponent({
    props: {
        /**
         * 类型。
         */
        type: {type: String as PropType<MetaTagTypes>, required: true},
        /**
         * 值。
         */
        value: {type: Object as PropType<MetaTagValues>, required: true},
        /**
         * 自动处理拖拽。会拖拽标准的meta tag对象。
         */
        draggable: Boolean,
        /**
         * 与是否响应click事件无关。它实际上指鼠标指针是否是可点击状。
         */
        clickable: Boolean,
        /**
         * 使用div包裹元素。
         */
        wrappedByDiv: Boolean,
        /**
         * 文本可被选择。
         */
        canBeSelected: Boolean
    },
    emits: ["click"],
    setup(props, { emit, slots }) {
        const type = toRef(props, "type")
        const data = toRef(props, "value")
        const dragEvents = useDraggable(type, data)

        const click = (e: MouseEvent) => emit("click", e)

        function renderElement() {
            const icon = props.type === "author" ? AUTHOR_TYPE_ICONS[(props.value as SimpleAuthor).type] : props.type === "topic" ? TOPIC_TYPE_ICONS[(props.value as SimpleTopic).type] : undefined

            return <span class={`tag is-${props.value.color} is-cursor-${props.clickable ? "pointer" : "default"}`} draggable={props.draggable} {...dragEvents} onClick={click}>
                {[
                    slots.frontOfTag?.(),
                    icon && <i class={`fa fa-${icon} mr-1`}/>,
                    props.canBeSelected ? <span class="can-be-selected">{props.value.name}</span> : props.value.name,
                    slots.backOfTag?.()
                ]}
            </span>
        }

        return () => props.wrappedByDiv ? <div>
            {slots.frontOfWrap?.()}
            {renderElement()}
            {slots.backOfWrap?.()}
        </div> : renderElement()
    }
})

/**
 * 为tag准备的组件：展示与标签树相关的主要信息。
 * 展示的信息除名称、颜色外，还包括组模式、标签类型。
 */
export const TagNodeElement = defineComponent({
    props: {
        /**
         * 值。
         */
        node: {type: Object as PropType<{id: number, name: string, color: string | null, type: TagType, group: IsGroup}>, required: true},
        /**
         * 自动处理拖拽。会拖拽标准的meta tag对象。
         */
        draggable: Boolean,
        /**
         * 与是否响应click事件无关。它实际上指鼠标指针是否是可点击状。
         */
        clickable: Boolean,
        /**
         * 设置一个回调函数，获取元素dom ref。
         */
        setRef: Function as PropType<(el: Element | ComponentPublicInstance | null) => void>
    },
    setup(props, { slots }) {
        const dragEvents = useDraggable("tag", computed(() => ({
            id: props.node.id,
            name: props.node.name,
            color: props.node.color
        })))

        function renderElement() {
            const isAddr = props.node.type !== "TAG"
            const isSequenced = props.node.group === "SEQUENCE" || props.node.group === "FORCE_AND_SEQUENCE"
            const isForced = props.node.group === "FORCE" || props.node.group === "FORCE_AND_SEQUENCE"
            const isGroup = props.node.group !== "NO"

            return <span ref={props.setRef} class={{"tag": true, [`is-${props.node.color}`]: !!props.node.color, "is-light": isAddr, "is-cursor-pointer": props.clickable, "is-cursor-default": !props.clickable}} draggable={props.draggable} {...dragEvents}>
                {[
                    slots.frontOfTag?.(),
                    isSequenced && <i class="fa fa-sort-alpha-down mr-1"/>,
                    isForced && <b class="mr-1">!</b>,
                    isGroup ? <>
                        <b class="mr-1">{'{'}</b>
                        {props.node.name}
                        <b class="ml-1">{'}'}</b>
                    </> : props.node.name,
                    slots.backOfTag?.()
                ]}
            </span>
        }

        return renderElement
    }
})

interface TagAddress {
    id: number
    address: {name: string, group: IsGroup}[]
    type: TagType
    color: string | null
}

/**
 * 为tag search准备的组件：展示一个标签与它的地址的主要信息。
 */
export const TagAddressElement = defineComponent({
    props: {
        /**
         * 值。
         */
        address: {type: Object as PropType<TagAddress>, required: true},
        /**
         * 自动处理拖拽。会拖拽标准的meta tag对象。
         */
        draggable: Boolean,
        /**
         * 与是否响应click事件无关。它实际上指鼠标指针是否是可点击状。
         */
        clickable: Boolean
    },
    setup(props) {
        const dragEvents = useDraggable("tag", computed(() => ({
            id: props.address.id,
            name: props.address.address[props.address.address.length - 1].name,
            color: props.address.color
        })))

        function renderElement() {
            const isAddr = props.address.type !== "TAG"

            const parts = props.address.address.map(part => {
                const isSequenced = part.group === "SEQUENCE" || part.group === "FORCE_AND_SEQUENCE"
                const isForced = part.group === "FORCE" || part.group === "FORCE_AND_SEQUENCE"
                const isGroup = part.group !== "NO"

                return [
                    isSequenced && <i class="fa fa-sort-alpha-down mr-1"/>,
                    isForced && <b class="mr-1">!</b>,
                    isGroup ? <>
                        <b class="mr-1">{'{'}</b>
                        {part.name}
                        <b class="ml-1">{'}'}</b>
                    </> : part.name
                ]
            })

            return <span class={{"tag": true, [`is-${props.address.color}`]: !!props.address.color, "is-light": isAddr, "is-cursor-pointer": props.clickable, "is-cursor-default": !props.clickable}} draggable={props.draggable} {...dragEvents}>
                {arrays.insertGap(parts, () => <b class="mx-half">.</b>)}
            </span>
        }

        return renderElement
    }
})

/**
 * 显示注解的组件。
 */
export const AnnotationElement = defineComponent({
    props: {
        /**
         * 值。
         */
        value: {type: Object as PropType<SimpleAnnotation>, required: true},
        /**
         * 自动处理拖拽。会拖拽标准的meta tag对象。
         */
        draggable: Boolean,
        /**
         * 与是否响应click事件无关。它实际上指鼠标指针是否是可点击状。
         */
        clickable: Boolean,
        /**
         * 文本可被选择。
         */
        canBeSelected: Boolean
    },
    setup(props, { slots }) {
        const dragEvents = useDraggable("annotation", toRef(props, "value"))

        return () => <span class={{"tag": true, "is-cursor-pointer": props.clickable, "is-cursor-default": !props.clickable}} draggable={props.draggable} {...dragEvents}>
            {slots.frontOfTag?.()}
            <b>[</b><span class={{"px-1": true, "can-be-selected": props.canBeSelected}}>{props.value.name}</span><b>]</b>
            {slots.backOfTag?.()}
        </span>
    }
})
