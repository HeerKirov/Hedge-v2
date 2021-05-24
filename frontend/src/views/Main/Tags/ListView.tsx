import { defineComponent, PropType, Transition, computed, toRef, Ref } from "vue"
import { TagTreeNode } from "@/functions/adapter-http/impl/tag"
import { useMessageBox, usePopupMenu } from "@/functions/module"
import { installation } from "@/functions/utils/basic"
import {
    useTagListContext,
    useTagPaneContext,
    installExpandedInfo,
    useExpandedValue,
    useDescriptionValue,
    ExpandedInfoContext
} from "./inject"
import style from "./style.module.scss"

export default defineComponent({
    setup() {
        const { loading, data } = useTagListContext()
        const expandedInfo = installExpandedInfo()
        installListMenu(expandedInfo)

        return () => <div class={style.listView}>
            {!loading.value ? data.value.map(tag => <RootNode key={tag.id} value={tag}/>) : null}
        </div>
    }
})

const RootNode = defineComponent({
    props: {
        value: {type: null as any as PropType<TagTreeNode>, required: true}
    },
    setup(props) {
        const { openDetailPane } = useTagPaneContext()
        const click = () => openDetailPane(props.value.id)

        const id = computed(() => props.value.id)
        const isExpanded = useExpandedValue(id)
        const switchExpanded = () => { isExpanded.value = !isExpanded.value }

        const menu = useListMenu(id)

        return () => <div class={[style.rootNode, "box"]}>
            <p class={style.titleBox} onContextmenu={menu.popup}>
                <a class={`has-text-${props.value.color}`} onClick={click}><b>{props.value.name}</b></a>
                <a onClick={switchExpanded} class={`ml-1 has-text-${props.value.color}`}>
                    <i class={`mx-2 fa fa-angle-${isExpanded.value ? "down" : "right"}`}/>
                </a>
                {isExpanded.value && <RootNodeDescription id={id.value} color={props.value.color ?? undefined}/>}
            </p>
            
            <Transition enterActiveClass={style.expandTransitionEnterActive} 
                        leaveActiveClass={style.expandTransitionLeaveActive} 
                        enterFromClass={style.expandTransitionEnterFrom} 
                        leaveToClass={style.expandTransitionLeaveTo}>
                {isExpanded.value && <div class={style.expandedBox}>
                    <ChildNodeList class="ml-1 mt-4" multiLine={true} value={props.value.children ?? []} color={props.value.color ?? undefined}/>
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
        color: String,
        multiLine: Boolean
    },
    setup(props) {
        return () => (props.multiLine ?? props.value.some(t => !!t.children?.length)) 
            ? <div class={[style.childNodeList]}>
                {props.value.map(tag => <div><ChildNode key={tag.id} value={tag} color={props.color}/></div>)}
            </div> : <div class={[style.childNodeList, style.inline]}>
                {props.value.map(tag => <ChildNode key={tag.id} value={tag} color={props.color}/>)}
            </div>
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

        return () => !!props.value.children?.length ? <>
            <TagElement value={props.value} color={props.color} onContextmenu={menu.popup}/>
            <a onClick={switchExpanded} onContextmenu={menu.popup} class={["tag", "ml-1", "is-light", props.color ? `is-${props.color}` : null]}>
                <i class={`fa fa-angle-${isExpanded.value ? "down" : "right"}`}/>
            </a>
            {isExpanded.value && <ChildNodeList class="ml-6" value={props.value.children ?? []} color={props.color}/>}
        </> : <TagElement value={props.value} color={props.color} onContextmenu={menu.popup}/>
    }
})

const TagElement = defineComponent({
    props: {
        value: {type: null as any as PropType<TagTreeNode>, required: true},
        color: String,
    },
    setup(props) {
        const { openDetailPane } = useTagPaneContext()
        const click = () => openDetailPane(props.value.id)

        return () => {
            const isAddr = props.value.type !== "TAG"
            const isSequenced = props.value.group === "SEQUENCE" || props.value.group === "FORCE_AND_SEQUENCE"
            const isForced = props.value.group === "FORCE" || props.value.group === "FORCE_AND_SEQUENCE"
            const isGroup = props.value.group !== "NO"

            return <a class={["tag", props.color ? `is-${props.color}` : null, isAddr ? "is-light" : null]} onClick={click}>
                {isSequenced && <i class="fa fa-sort-alpha-down mr-1"/>}
                {isForced && <b class="mr-1">!</b>}
                {isGroup ? <>
                    <b class="mr-1">{'{'}</b>
                    {props.value.name}
                    <b class="ml-1">{'}'}</b>
                </> : props.value.name}
            </a>
        }
    }
})

function useListMenu(id: Ref<number>) {
    const menu = useListMenuContext()

    const popup = () => menu.popup(id.value)

    return {popup}
}

const [installListMenu, useListMenuContext] = installation(function(expandedInfo: ExpandedInfoContext) {
    const messageBox = useMessageBox()
    const { openDetailPane } = useTagPaneContext()
    const { indexedInfo, deleteTag } = useTagListContext()

    const expandChildren = (id: number) => expandedInfo.setAllForChildren(id, true)
    const collapseChildren = (id: number) => expandedInfo.setAllForChildren(id, false)

    const deleteItem = async (id: number) => {
        const info = indexedInfo.value[id]
        if(info) {
            const hasChildren = !!info.tag.children?.length
            if(await messageBox.showYesNoMessage("warn", "确定要删除此项吗？", hasChildren ? "此操作将级联删除从属的所有子标签，且不可撤回。" : "此操作不可撤回。")) {
                deleteTag(id)
            }
        }
    }

    const menu = usePopupMenu<number>([
        {type: "normal", label: "查看详情", click: openDetailPane},
        {type: "separator"},
        {type: "normal", label: "展开下属标签", click: expandChildren},
        {type: "normal", label: "折叠下属标签", click: collapseChildren},
        {type: "separator"},
        {type: "normal", label: "新建子标签"},
        {type: "normal", label: "在此标签之前新建"},
        {type: "normal", label: "在此标签之后新建"},
        {type: "separator"},
        {type: "normal", label: "删除此标签", click: deleteItem}
    ])

    const popup = (id: number) => menu.popup(id)

    return {popup}
})
