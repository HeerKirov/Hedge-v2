import { computed, defineComponent, onBeforeUnmount, PropType, toRef, toRefs, Transition } from "vue"
import { TagTreeNode } from "@/functions/adapter-http/impl/tag"
import { useDraggable } from "@/functions/drag"
import { useExpandedValue, useTagTreeContext, useDescriptionValue, useTagDrop, useTagTreeAccessor, installTagTreeContext } from "./inject"
import type { TagTreeEventCallbackContext } from "./inject"
import style from "./style.module.scss"

export { installTagTreeContext, useTagTreeAccessor, TagTreeEventCallbackContext }

/**
 * tag tree的根节点列表。它实质上是标准节点列表，但是通过包装有一个不太一样的根节点外壳。
 */
export const RootNodeList = defineComponent({
    props: {
        items: {type: Array as PropType<TagTreeNode[]>, required: true}
    },
    setup(props) {
        return () => props.items.flatMap((node, index) => [
            <Gap parentId={null} ordinal={index}/>,
            <RootNodeItem key={node.id} node={node}/>
        ]).concat(<Gap parentId={null} ordinal={props.items.length}/>)
    }
})

/**
 * tag tree中的一个根节点实现。
 */
const RootNodeItem = defineComponent({
    props: {
        node: {type: Object as PropType<TagTreeNode>, required: true}
    },
    setup(props) {
        const node = toRef(props, "node")
        const id = computed(() => props.node.id)

        const { isDraggable, event, elementRef } = useTagTreeContext()

        const isExpanded = useExpandedValue(id)

        const draggable = computed(() => isDraggable(props.node))
        const dragEvents = useDraggable("tag", computed(() => ({
            id: node.value.id,
            name: node.value.name,
            color: node.value.color
        })))
        const click = () => event.click(node.value)
        const rightClick = () => event.rightClick(node.value)

        onBeforeUnmount(() => elementRef.setElement(id.value, undefined))

        return () => <div class={[style.rootNodeItem, "box"]}>
            <p onContextmenu={rightClick}>
                <a ref={el => elementRef.setElement(id.value, el)}
                   class={props.node.color ? `has-text-${props.node.color}` : "has-text-dark"}
                   onClick={click} draggable={draggable.value} {...dragEvents}>
                    <b>{props.node.name}</b>
                </a>
                <NodeItemExpandButton class="ml-2 mr-1" color={props.node.color ?? undefined} hasWhiteBg={true}
                                      isExpanded={isExpanded.value}
                                      onClick={() => isExpanded.value = !isExpanded.value}
                                      parentId={props.node.id}/>
                {isExpanded.value && <RootNodeDescription id={id.value} color={props.node.color ?? undefined}/>}
            </p>

            <Transition enterActiveClass={style.expandTransitionEnterActive}
                        leaveActiveClass={style.expandTransitionLeaveActive}
                        enterFromClass={style.expandTransitionEnterFrom}
                        leaveToClass={style.expandTransitionLeaveTo}>
                {isExpanded.value && <div class={style.expandedBox}>
                    <NodeList class="ml-1 mt-4" multiLine={true} parentId={id.value}
                              items={props.node.children ?? []}/>
                </div>}
            </Transition>
        </div>
    }
})

const RootNodeDescription = defineComponent({
    props: {
        id: {type: Number, required: true},
        color: String
    },
    setup(props) {
        const description = useDescriptionValue(toRef(props, "id"))

        return () => <span class={`is-size-small ml-2 has-text-${props.color}`}>{description.value}</span>
    }
})

/**
 * tag tree中的一个节点列表。它就是递归实现的一颗标签树。
 */
export const NodeList = defineComponent({
    props: {
        items: {type: Array as PropType<TagTreeNode[]>, required: true},
        parentId: {type: null as any as PropType<number | null>, default: null},
        multiLine: Boolean
    },
    setup(props) {
        return () => (props.multiLine || props.items.some(t => !!t.children?.length))
            ? <div class={[style.nodeList]}>
                {props.items.flatMap((node, index) => [
                    <Gap parentId={props.parentId} ordinal={index}/>,
                    <div class={style.child} key={node.id}><NodeItem node={node}/></div>
                ])}
                <Gap parentId={props.parentId} ordinal={props.items.length}/>
            </div> : <div class={[style.nodeList, style.inline]}>
                {props.items.flatMap((node, index) => [
                    <Gap parentId={props.parentId} ordinal={index}/>,
                    <NodeItem class={style.child} key={node.id} node={node}/>
                ])}
                <Gap parentId={props.parentId} ordinal={props.items.length}/>
            </div>
    }
})

/**
 * tag tree中的一个节点。
 */
const NodeItem = defineComponent({
    props: {
        node: {type: Object as PropType<TagTreeNode>, required: true}
    },
    setup(props) {
        const node = toRef(props, "node")

        const { event } = useTagTreeContext()

        const isExpanded = useExpandedValue(computed(() => props.node.id))

        const click = () => event.click(node.value)
        const rightClick = () => event.rightClick(node.value)

        return () => !!props.node.children?.length ? (<>
            <p>
                <NodeItemElement node={props.node} onClick={click} onContextmenu={rightClick}/>
                <NodeItemExpandButton class="ml-1" isExpanded={isExpanded.value} color={props.node.color ?? undefined} parentId={props.node.id}
                                      onClick={() => isExpanded.value = !isExpanded.value} onContextmenu={rightClick}/>
            </p>
            {isExpanded.value && <NodeList class="ml-6" parentId={props.node.id} items={props.node.children ?? []} color={props.node.color}/>}
        </>) : (
            <NodeItemElement node={props.node} onClick={click} onContextmenu={rightClick}/>
        )
    }
})

/**
 * 节点中tag元素的实现组件。
 */
const NodeItemElement = defineComponent({
    props: {
        node: {type: Object as PropType<TagTreeNode>, required: true}
    },
    setup(props) {
        const id = computed(() => props.node.id)
        const { isDraggable, elementRef } = useTagTreeContext()

        const draggable = computed(() => isDraggable(props.node))
        const dragEvents = useDraggable("tag", computed(() => ({
            id: props.node.id,
            name: props.node.name,
            color: props.node.color
        })))

        onBeforeUnmount(() => elementRef.setElement(id.value, undefined))

        return () => {
            const isAddr = props.node.type !== "TAG"
            const isSequenced = props.node.group === "SEQUENCE" || props.node.group === "FORCE_AND_SEQUENCE"
            const isForced = props.node.group === "FORCE" || props.node.group === "FORCE_AND_SEQUENCE"
            const isGroup = props.node.group !== "NO"

            return <a ref={el => elementRef.setElement(id.value, el)} draggable={draggable.value} {...dragEvents}
                      class={["tag", props.node.color ? `is-${props.node.color}` : null, isAddr ? "is-light" : null]}>
                {isSequenced && <i class="fa fa-sort-alpha-down mr-1"/>}
                {isForced && <b class="mr-1">!</b>}
                {isGroup ? <>
                    <b class="mr-1">{'{'}</b>
                    {props.node.name}
                    <b class="ml-1">{'}'}</b>
                </> : props.node.name}

                <NodeItemDropArea parentId={props.node.id}/>
            </a>
        }
    }
})

/**
 * 节点中展开按钮的实现组件。
 */
const NodeItemExpandButton = defineComponent({
    props: {
        isExpanded: Boolean,
        color: String,
        hasWhiteBg: Boolean,
        parentId: {type: null as any as PropType<number | null>, required: true}
    },
    setup(props) {
        const parentId = toRef(props, "parentId")
        const { isDragover, ...dropEvents } = useTagDrop(parentId, null)

        return () => <a class={isDragover.value ? ["tag", `is-${props.color}`] : props.hasWhiteBg ? ["tag", "has-bg-white", `has-text-${props.color}`] : ["tag", "is-light", `is-${props.color}`]}>
            <i class={`fa fa-angle-${props.isExpanded ? "down" : "right"}`}/>
            <div class={style.transparentHitArea} {...dropEvents}/>
        </a>
    }
})

/**
 * 节点中拖放区域的实现组件。
 */
const NodeItemDropArea = defineComponent({
    props: {
        parentId: {type: null as any as PropType<number | null>, required: true}
    },
    setup(props) {
        const parentId = toRef(props, "parentId")
        const { isDragover, ...dropEvents } = useTagDrop(parentId, null)

        return () => <div class={{[style.dropArea]: true, [style.isDragover]: isDragover.value}}>
            <i class="fa fa-angle-down" v-show={isDragover.value}/>
            <div class={style.transparentHitArea} {...dropEvents}/>
        </div>
    }
})

/**
 * 处于标签中间的空隙(包括横向和纵向)，作用是接收拖放。
 */
const Gap = defineComponent({
    props: {
        parentId: {type: null as any as PropType<number | null>, required: true},
        ordinal: {type: Number, required: true}
    },
    setup(props) {
        const { parentId, ordinal } = toRefs(props)
        const { isDragover, ...dropEvents } = useTagDrop(parentId, ordinal)

        return () => <div class={{[style.gap]: true, [style.isDragover]: isDragover.value}} {...dropEvents}/>
    }
})
