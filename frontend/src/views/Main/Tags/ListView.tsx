import { defineComponent, PropType, Transition, computed, toRef, toRefs, Ref } from "vue"
import { TagTreeNode } from "@/functions/adapter-http/impl/tag"
import { TagTreeElement } from "@/layouts/display-components"
import { useMessageBox, usePopupMenu } from "@/functions/module"
import { useDraggable, useDroppableBy } from "@/functions/drag"
import { installation } from "@/functions/utils/basic"
import {
    useTagListContext, useTagPaneContext, useEditLock, installExpandedInfo,
    useExpandedValue, useDescriptionValue, ExpandedInfoContext
} from "./inject"
import style from "./style.module.scss"

export default defineComponent({
    setup() {
        const { loading, data } = useTagListContext()
        const expandedInfo = installExpandedInfo()
        installListMenuContext(expandedInfo)

        return () => <div class={style.listView}>
            {loading.value ? null
            : data.value.length > 0 ? data.value.flatMap((tag, index) => [
                <Gap parentId={null} ordinal={index}/>,
                <RootNode key={tag.id} value={tag}/>
            ]).concat(<Gap parentId={null} ordinal={data.value.length}/>)
            : <AddFirstNode/>}
        </div>
    }
})

const AddFirstNode = defineComponent({
    setup() {
        const { openCreatePane } = useTagPaneContext()

        const click = () => openCreatePane({})

        return () => <div class={[style.rootNode, "box"]}>
            <a class="has-text-green" onClick={click}>
                添加第一个标签
                <i class="fa fa-plus ml-2"/>
            </a>
        </div>
    }
})

const RootNode = defineComponent({
    props: {
        value: {type: null as any as PropType<TagTreeNode>, required: true}
    },
    setup(props) {
        const editLock = useEditLock()
        const { openDetailPane } = useTagPaneContext()
        const click = () => openDetailPane(props.value.id)

        const id = computed(() => props.value.id)
        const data = toRef(props, "value")
        const isExpanded = useExpandedValue(id)
        const switchExpanded = () => { isExpanded.value = !isExpanded.value }

        const dragEvents = useDraggable("tag", computed(() => ({
            id: data.value.id,
            name: data.value.name,
            color: data.value.color
        })))

        const menu = useListMenu(id)

        return () => <div class={[style.rootNode, "box"]}>
            <p onContextmenu={menu.popup}>
                <a class={props.value.color ? `has-text-${props.value.color}` : "has-text-dark"} onClick={click} draggable={!editLock.value} {...dragEvents}>
                    <b>{props.value.name}</b>
                </a>
                <ExpandButton class="ml-2 mr-1" isExpanded={isExpanded.value} color={props.value.color ?? undefined} parentId={id.value} hasWhiteBg={true} onClick={switchExpanded}/>
                {isExpanded.value && <RootNodeDescription id={id.value} color={props.value.color ?? undefined}/>}
            </p>
            
            <Transition enterActiveClass={style.expandTransitionEnterActive} 
                        leaveActiveClass={style.expandTransitionLeaveActive} 
                        enterFromClass={style.expandTransitionEnterFrom} 
                        leaveToClass={style.expandTransitionLeaveTo}>
                {isExpanded.value && <div class={style.expandedBox}>
                    <ChildNodeList class="ml-1 mt-4" multiLine={true} parentId={id.value} value={props.value.children ?? []} color={props.value.color ?? undefined}/>
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
        const id = toRef(props, "id")
        const description = useDescriptionValue(id)

        return () => <span class={`is-size-small ml-2 has-text-${props.color}`}>{description.value}</span>
    }
})

const ChildNodeList = defineComponent({
    props: {
        value: {type: null as any as PropType<TagTreeNode[]>, required: true},
        parentId: {type: Number, required: true},
        color: String,
        multiLine: Boolean
    },
    setup(props) {
        return () => (props.multiLine || props.value.some(t => !!t.children?.length))
            ? <div class={[style.childNodeList]}>
                {props.value.flatMap((tag, index) => [
                    <Gap parentId={props.parentId} ordinal={index}/>,
                    <div class={style.child} key={tag.id}><ChildNode value={tag} color={props.color}/></div>
                ])}
                <Gap parentId={props.parentId} ordinal={props.value.length}/>
            </div> : <div class={[style.childNodeList, style.inline]}>
                {props.value.flatMap((tag, index) => [
                    <Gap parentId={props.parentId} ordinal={index}/>,
                    <ChildNode class={style.child} key={tag.id} value={tag} color={props.color}/>
                ])}
                <Gap parentId={props.parentId} ordinal={props.value.length}/>
            </div>
    }
})

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

const ChildNode = defineComponent({
    props: {
        value: {type: null as any as PropType<TagTreeNode>, required: true},
        color: String,
    },
    setup(props) {
        const id = computed(() => props.value.id)
        const isExpanded = useExpandedValue(id)
        const switchExpanded = () => isExpanded.value = !isExpanded.value

        const menu = useListMenu(id)

        const editLock = useEditLock()
        const { openDetailPane } = useTagPaneContext()
        const click = () => openDetailPane(props.value.id)

        const data = toRef(props, "value")

        return () => !!props.value.children?.length ? <>
            <TagTreeElement value={props.value} color={props.color} onClick={click} onContextmenu={menu.popup} draggable={!editLock.value}>
                <TagElementDropArea parentId={data.value.id}/>
            </TagTreeElement>
            <ExpandButton class="ml-1" isExpanded={isExpanded.value} color={props.color} parentId={id.value} onClick={switchExpanded} onRightClick={menu.popup}/>
            {isExpanded.value && <ChildNodeList class="ml-6" parentId={id.value} value={props.value.children ?? []} color={props.color}/>}
        </> : <TagTreeElement value={props.value} color={props.color} onClick={click} onContextmenu={menu.popup} draggable={!editLock.value}>
            <TagElementDropArea parentId={data.value.id}/>
        </TagTreeElement>
    }
})

const ExpandButton = defineComponent({
    props: {
        isExpanded: Boolean,
        color: String,
        hasWhiteBg: Boolean,
        parentId: {type: null as any as PropType<number | null>, required: true}
    },
    emits: ["click", "rightClick"],
    setup(props, { emit }) {
        const parentId = toRef(props, "parentId")
        const { isDragover, ...dropEvents } = useTagDrop(parentId, null)

        const click = () => emit("click")
        const rightClick = () => emit("rightClick")
        return () => <a class={{"tag": true, "is-light": !isDragover.value, "has-bg-white": props.hasWhiteBg && !isDragover.value, [`is-${props.color}`]: !!props.color}}
                        onClick={click} onContextmenu={rightClick}>
            <i class={`fa fa-angle-${props.isExpanded ? "down" : "right"}`}/>
            <div class={style.area} {...dropEvents}/>
        </a>
    }
})

const TagElementDropArea = defineComponent({
    props: {
        parentId: {type: null as any as PropType<number | null>, required: true}
    },
    setup(props) {
        const parentId = toRef(props, "parentId")
        const { isDragover, ...dropEvents } = useTagDrop(parentId, null)

        return () => <div class={{[style.dropArea]: true, [style.isDragover]: isDragover.value}}>
            <i class="fa fa-angle-down" v-show={isDragover.value}/>
            <div class={style.area} {...dropEvents}/>
        </div>
    }
})

const [installListMenuContext, useListMenuContext] = installation(function(expandedInfo: ExpandedInfoContext) {
    const messageBox = useMessageBox()
    const { openCreatePane, openDetailPane, closePane, detailMode } = useTagPaneContext()
    const { fastEndpoint, indexedInfo, syncDeleteTag } = useTagListContext()

    const expandChildren = (id: number) => expandedInfo.setAllForChildren(id, true)
    const collapseChildren = (id: number) => expandedInfo.setAllForChildren(id, false)

    const createChild = (id: number) => openCreatePane({parentId: id})
    const createBefore = (id: number) => {
        const info = indexedInfo.value[id]
        if(info) openCreatePane({parentId: info.parentId ?? undefined, ordinal: info.ordinal})
    }
    const createAfter = (id: number) => {
        const info = indexedInfo.value[id]
        if(info) openCreatePane({parentId: info.parentId ?? undefined, ordinal: info.ordinal + 1})
    }

    const deleteItem = async (id: number) => {
        const info = indexedInfo.value[id]
        if(info) {
            const hasChildren = !!info.tag.children?.length
            if(await messageBox.showYesNoMessage("warn", "确定要删除此项吗？", hasChildren ? "此操作将级联删除从属的所有子标签，且不可撤回。" : "此操作不可撤回。")) {
                await fastEndpoint.deleteData(id)
                syncDeleteTag(id)
                if(detailMode.value === id) {
                    closePane()
                }
            }
        }
    }

    const menu = usePopupMenu<number>([
        {type: "normal", label: "查看详情", click: openDetailPane},
        {type: "separator"},
        {type: "normal", label: "折叠全部标签", click: collapseChildren},
        {type: "normal", label: "展开全部标签", click: expandChildren},
        {type: "separator"},
        {type: "normal", label: "新建子标签", click: createChild},
        {type: "normal", label: "在此标签之前新建", click: createBefore},
        {type: "normal", label: "在此标签之后新建", click: createAfter},
        {type: "separator"},
        {type: "normal", label: "删除此标签", click: deleteItem}
    ])

    const popup = (id: number) => menu.popup(id)

    return {popup}
})

function useListMenu(id: Ref<number>) {
    const menu = useListMenuContext()

    const popup = () => menu.popup(id.value)

    return {popup}
}

function useTagDrop(parentId: Ref<number | null>, ordinal: Ref<number | null> | null) {
    const { move } = useMoveFeature()
    return useDroppableBy("tag", tag => move(tag.id, parentId.value, ordinal?.value ?? null))
}

function useMoveFeature() {
    const messageBox = useMessageBox()
    const { fastEndpoint, data, indexedInfo, syncMoveTag } = useTagListContext()

    function getTarget(currentParentId: number | null, currentOrdinal: number, insertParentId: number | null, insertOrdinal: number | null): {parentId: number | null, ordinal: number} {
        if(insertOrdinal === null) {
            //省略insert ordinal表示默认操作
            if(currentParentId === insertParentId) {
                //parent不变时的默认操作是不移动
                return {parentId: insertParentId, ordinal: currentOrdinal}
            }else{
                //parent变化时的默认操作是移动到列表末尾，此时需要得到列表长度
                const count = insertParentId !== null ? (indexedInfo.value[insertParentId]!.tag.children?.length ?? 0) : data.value.length
                return {parentId: insertParentId, ordinal: count}
            }
        }else{
            if(currentParentId === insertParentId && insertOrdinal > currentOrdinal) {
                //目标parentId保持不变
                //插入的位置在当前位置之后，这符合开头描述的特殊情况，因此发送给API的ordinal需要调整
                return {parentId: insertParentId, ordinal: insertOrdinal - 1}
            }else{
                return {parentId: insertParentId, ordinal: insertOrdinal}
            }
        }
    }

    /**
     * 将指定的节点移动到标定的插入位置。
     * @param sourceId 指定节点的tag id。
     * @param insertParentId 插入目标节点的id。null表示插入到根列表。
     * @param insertOrdinal 插入目标节点后的排序顺位。null表示默认操作(追加到节点末尾，或者对于相同parent不执行移动)
     */
    const move = (sourceId: number, insertParentId: number | null, insertOrdinal: number | null) => {
        //需要注意的是，前端的insert(parent, ordinal)含义与API的target(parent, ordinal)并不一致。
        //API的含义是"移动到此目标位置"，也就是移动后的ordinal保证与给出的一致(除非超过最大值)。
        //而前端的含义则是"插入到此目标之前"。与API相比，在parent不变、移动到靠后的位置时，调API的位置实际上要-1。

        const info = indexedInfo.value[sourceId]
        if(!info) {
            console.error(`Error occurred while moving tag ${sourceId}: cannot find indexed info.`)
            return
        }
        const target = getTarget(info.parentId, info.ordinal, insertParentId, insertOrdinal)

        if(target.parentId === info.parentId && target.ordinal === info.ordinal || sourceId === target.parentId) {
            //没有变化，或插入目标是其自身时，跳过操作
            return
        }

        //如果parentId不变，则将其摘出参数
        const form = target.parentId === info.parentId ? {ordinal: target.ordinal} : target

        fastEndpoint.setData(sourceId, form, e => {
            if(e.code === "RECURSIVE_PARENT") {
                messageBox.showOkMessage("prompt", "无法移动到此位置。", "无法将标签移动到其子标签下。")
            }else{
                return e
            }
        }).then(ok => {
            if(ok) syncMoveTag(sourceId, target.parentId, target.ordinal)
        })
    }

    return {move}
}
