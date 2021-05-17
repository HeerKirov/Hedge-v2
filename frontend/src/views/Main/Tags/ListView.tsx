import { TagTreeNode } from "@/functions/adapter-http/impl/tag"
import { defineComponent, ref, PropType, Transition } from "vue"
import { useTagContext } from "./inject"
import style from "./style.module.scss"

export default defineComponent({
    setup() {
        const { loading, data } = useTagContext()

        return () => <div class={style.listView}>
            {!loading.value ? data.value.map(tag => <RootNode key={tag.id} value={tag} description="..."/>) : null}
        </div>
    }
})

const RootNode = defineComponent({
    props: {
        value: {type: null as any as PropType<TagTreeNode>, required: true},
        description: String //TODO 生成description
    },
    setup(props) {
        const { openDetailPane } = useTagContext()
        const click = () => openDetailPane(props.value.id)

        const isExpanded = ref(false) // default false
        const switchExpanded = () => { isExpanded.value = !isExpanded.value }

        return () => <div class={[style.rootNode, "box"]}>
            <p class={style.titleBox}>
                <a class={`has-text-${props.value.color}`} onClick={click}><b>{props.value.name}</b></a>
                <a onClick={switchExpanded} class={`tag ml-1 is-${props.value.color} is-light has-bg-white`}>
                    <i class={`fa fa-angle-${isExpanded.value ? "down" : "right"}`}/>
                </a>
                {isExpanded.value && <span class={`is-size-small ml-2 has-text-${props.value.color}`}>{props.description}</span>}
            </p>
            
            <Transition enterActiveClass={style.expandTransitionEnterActive} 
                        leaveActiveClass={style.expandTransitionLeaveActive} 
                        enterFromClass={style.expandTransitionEnterFrom} 
                        leaveToClass={style.expandTransitionLeaveTo}>
                {isExpanded.value && <div class={style.expandedBox}>
                    <ChildNodeList class="ml-1 mt-4" multiLine={true} value={props.value.children ?? []}/>
                </div>}
            </Transition>
        </div>
    }
})

const ChildNodeList = defineComponent({
    props: {
        value: {type: null as any as PropType<TagTreeNode[]>, required: true},
        multiLine: Boolean
    },
    setup(props) {
        return () => (props.multiLine ?? props.value.some(t => !!t.children?.length)) 
            ? <div class={[style.childNodeList]}>
                {props.value.map(tag => <div><ChildNode key={tag.id} value={tag}/></div>)}
            </div> : <div class={[style.childNodeList, style.inline]}>
                {props.value.map(tag => <ChildNode key={tag.id} value={tag}/>)}
            </div>
    }
})

const ChildNode = defineComponent({
    props: {
        value: {type: null as any as PropType<TagTreeNode>, required: true}
    },
    setup(props) {
        const isExpanded = ref(false) // default false
        const switchExpanded = () => isExpanded.value = !isExpanded.value

        return () => !!props.value.children?.length ? <>
            <TagElement value={props.value}/>
            <a onClick={switchExpanded} class={["tag", "ml-1", "is-light", props.value.color ? `is-${props.value.color}` : null]}>
                <i class={`fa fa-angle-${isExpanded.value ? "down" : "right"}`}/>
            </a>
            {isExpanded.value && <ChildNodeList class="ml-6" value={props.value.children ?? []}/>}
        </> : <TagElement value={props.value}/>
    }
})

const TagElement = defineComponent({
    props: {
        value: {type: null as any as PropType<TagTreeNode>, required: true}
    },
    setup(props) {
        const { openDetailPane } = useTagContext()
        const click = () => openDetailPane(props.value.id)

        return () => {
            const isAddr = props.value.type !== "TAG"
            const isSequenced = props.value.group === "SEQUENCE" || props.value.group === "FORCE_AND_SEQUENCE"
            const isForced = props.value.group === "FORCE" || props.value.group === "FORCE_AND_SEQUENCE"
            const isGroup = props.value.group !== "NO"

            return <a class={["tag", props.value.color ? `is-${props.value.color}` : null, isAddr ? "is-light" : null]} onClick={click}>
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