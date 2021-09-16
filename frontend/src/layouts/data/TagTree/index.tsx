import { computed, defineComponent, onBeforeUnmount, PropType, toRef, Transition } from "vue"
import { TagTreeNode } from "@/functions/adapter-http/impl/tag"
import { useDraggable } from "@/functions/drag"
import { useExpandedValue, useTagTreeContext, useDescriptionValue } from "./inject"
import style from "./style.module.scss"

/**
 * tag tree的根节点列表。它实质上是标准节点列表，但是通过包装有一个不太一样的根节点外壳。
 */
export const RootNodeList = defineComponent({
    props: {
        items: {type: Array as PropType<TagTreeNode[]>, required: true}
    },
    setup(props) {
        return props.items.flatMap((node, index) => [
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

        const { isEditable, event, elementRef } = useTagTreeContext()

        const isExpanded = useExpandedValue(id)

        const dragEvents = useDraggable("tag", computed(() => ({
            id: node.value.id,
            name: node.value.name,
            color: node.value.color
        })))
        const click = () => event.click(node.value)
        const rightClick = () => event.rightClick(node.value)

        onBeforeUnmount(() => elementRef.setElement(id.value, undefined))

        return () => <div class={[style.rootNode, "box"]}>
            <p onContextmenu={rightClick}>
                <a ref={el => elementRef.setElement(id.value, el)} class={props.node.color ? `has-text-${props.node.color}` : "has-text-dark"}
                   onClick={click} draggable={isEditable()} {...dragEvents}>
                    <b>{props.node.name}</b>
                </a>
                <NodeItemExpandButton class="ml-2 mr-1" color={props.node.color ?? undefined} hasWhiteBg={true}
                                      isExpanded={isExpanded.value} onClick={isExpanded.value = !isExpanded.value}
                                      parentId={props.node.id}/>
                {isExpanded.value && <RootNodeDescription id={id.value} color={props.node.color ?? undefined}/>}
            </p>

            <Transition enterActiveClass={style.expandTransitionEnterActive}
                        leaveActiveClass={style.expandTransitionLeaveActive}
                        enterFromClass={style.expandTransitionEnterFrom}
                        leaveToClass={style.expandTransitionLeaveTo}>
                {isExpanded.value && <div class={style.expandedBox}>
                    <NodeList class="ml-1 mt-4" multiLine={true} parentId={id.value} items={props.node.children ?? []}/>
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
            ? <div class={[style.childNodeList]}>
                {props.items.flatMap((node, index) => [
                    <Gap parentId={props.parentId} ordinal={index}/>,
                    <div class={style.child} key={node.id}><NodeItem node={node}/></div>
                ])}
                <Gap parentId={props.parentId} ordinal={props.items.length}/>
            </div> : <div class={[style.childNodeList, style.inline]}>
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
    }
})

/**
 * 节点中tag元素的实现组件。
 */
const NodeItemElement = defineComponent({
    props: {
        node: {type: Object as PropType<TagTreeNode>, required: true}
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
    }
})

/**
 * 节点中拖放区域的实现组件。
 */
const NodeItemDropArea = defineComponent({
    props: {
        parentId: {type: null as any as PropType<number | null>, required: true}
    }
})

/**
 * 处于标签中间的空隙(包括横向和纵向)，作用是接收拖放。
 */
const Gap = defineComponent({
    props: {
        parentId: {type: null as any as PropType<number | null>, required: true},
        ordinal: {type: Number, required: true}
    }
})
