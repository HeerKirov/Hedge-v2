import { computed, defineComponent, PropType, reactive, watch } from "vue"
import Input from "@/components/forms/Input"
import { AuthorType } from "@/functions/adapter-http/impl/author"
import { TopicType } from "@/functions/adapter-http/impl/topic"
import { TagTreeNode } from "@/functions/adapter-http/impl/tag"
import { AUTHOR_TYPE_ICONS } from "@/definitions/author"
import { TOPIC_TYPE_ICONS } from "@/definitions/topic"
import { usePopupMenu } from "@/functions/module"
import { useDraggable } from "@/functions/drag"
import { installation } from "@/functions/utils/basic"
import { ExpandedInfoContext, useExpandedInfo, useExpandedValue, useTagListContext } from "@/functions/api/tag-tree"
import { useMetaDatabaseAuthorContext, useMetaDatabaseTopicContext, usePanelContext } from "./inject"
import style from "./style.module.scss"

export default defineComponent({
    setup() {
        const { rightColumnData: { tabDbType }} = usePanelContext()

        const searchBox = reactive({author: "", topic: "", tag: ""})
        const updateSearchBox = (value: string) => searchBox[tabDbType.value] = value

        return () => <>
            <div class="mx-1">
                <button class={`button is-small is-${tabDbType.value === "author" ? "link" : "white"} mr-1 mb-1`} onClick={() => tabDbType.value = "author"}>
                    <span class="icon"><i class="fa fa-user-tag"/></span>
                    <span>作者</span>
                </button>
                <button class={`button is-small is-${tabDbType.value === "topic" ? "link" : "white"} mr-1 mb-1`} onClick={() => tabDbType.value = "topic"}>
                    <span class="icon"><i class="fa fa-hashtag"/></span>
                    <span>主题</span>
                </button>
                <button class={`button is-small is-${tabDbType.value === "tag" ? "link" : "white"} mr-1 mb-1`} onClick={() => tabDbType.value = "tag"}>
                    <span class="icon"><i class="fa fa-tag"/></span>
                    <span>标签</span>
                </button>
                <Input class="is-small is-width-medium mb-1" placeholder="搜索项目" value={searchBox[tabDbType.value]} onUpdateValue={updateSearchBox}/>
            </div>
            {tabDbType.value === "author"
                ? <AuthorTab search={searchBox.author}/>
            : tabDbType.value === "topic"
                ? <TopicTab search={searchBox.topic}/>
            : //tag
                <TagTab search={searchBox.tag}/>
            }
        </>
    }
})

const AuthorTab = defineComponent({
    props: {
        search: {type: String, required: true}
    },
    setup(props) {
        const { data, search } = useMetaDatabaseAuthorContext()
        const showMore = computed(() => !data.loading.value && data.data.value.total > data.data.value.result.length)

        watch(() => props.search, s => search.value = s, {immediate: true})

        return () => <div class={[style.metaDatabase, style.author]}>
            {data.data.value.result.map(item => <AuthorItem id={item.id} name={item.name} color={item.color} type={item.type}/>)}
            {showMore.value && <button class="button is-small is-white mt-1" onClick={data.next}>加载更多…</button>}
        </div>
    }
})

const TopicTab = defineComponent({
    props: {
        search: {type: String, required: true}
    },
    setup(props) {
        const { data, search } = useMetaDatabaseTopicContext()
        const showMore = computed(() => !data.loading.value && data.data.value.total > data.data.value.result.length)

        watch(() => props.search, s => search.value = s, {immediate: true})

        return () => <div class={[style.metaDatabase, style.topic]}>
            {data.data.value.result.map(item => <TopicItem key={item.id} id={item.id} name={item.name} color={item.color} type={item.type}/>)}
            {showMore.value && <button class="button is-small is-white mt-1" onClick={data.next}>加载更多…</button>}
        </div>
    }
})

const TagTab = defineComponent({
    props: {
        search: {type: String, required: true}
    },
    setup() {
        const { loading, data } = useTagListContext()
        const expandedInfo = useExpandedInfo()
        installTagExpandMenu(expandedInfo)

        return () => <div class={[style.metaDatabase, style.tag]}>
            {loading.value ? null : <TagItemList value={data.value} multiLine={true}/>}
        </div>
    }
})

const AuthorItem = defineComponent({
    props: {
        id: {type: Number, required: true},
        name: {type: String, required: true},
        color: {type: null as any as PropType<string | null>, required: true},
        type: {type: String as PropType<AuthorType>, required: true}
    },
    setup(props) {
        const dragEvents = useDraggable("author", computed(() => ({
            id: props.id,
            name: props.name,
            color: props.color,
            type: props.type
        })))

        return () => <div class={style.tagItem}>
            <span class={`tag is-${props.color}`} draggable={true} {...dragEvents}>
                {props.type && <i class={`fa fa-${AUTHOR_TYPE_ICONS[props.type]} mr-1`}/>}
                {props.name}
            </span>
        </div>
    }
})

const TopicItem = defineComponent({
    props: {
        id: {type: Number, required: true},
        name: {type: String, required: true},
        color: {type: null as any as PropType<string | null>, required: true},
        type: {type: String as PropType<TopicType>, required: true}
    },
    setup(props) {
        const dragEvents = useDraggable("topic", computed(() => ({
            id: props.id,
            name: props.name,
            color: props.color,
            type: props.type
        })))

        return () => <div class={style.tagItem}>
            <span class={`tag is-${props.color}`} draggable={true} {...dragEvents}>
                {props.type && <i class={`fa fa-${TOPIC_TYPE_ICONS[props.type]} mr-1`}/>}
                {props.name}
            </span>
        </div>
    }
})

const TagItemList = defineComponent({
    props: {
        value: {type: null as any as PropType<TagTreeNode[]>, required: true},
        color: String,
        multiLine: Boolean
    },
    setup(props) {
        return () => (props.multiLine || props.value.some(t => !!t.children?.length))
            ? <div class={style.childNodeList}>
                {props.value.map(tag => <div class={style.child} key={tag.id}><TagItem value={tag} color={props.color ?? tag.color ?? undefined}/></div>)}
            </div> : <div class={[style.childNodeList, style.inline]}>
                {props.value.map(tag => <TagItem class={style.child} key={tag.id} value={tag} color={props.color ?? tag.color ?? undefined}/>)}
            </div>
    }
})

const TagItem = defineComponent({
    props: {
        value: {type: null as any as PropType<TagTreeNode>, required: true},
        color: String
    },
    setup(props) {
        const id = computed(() => props.value.id)
        const isExpanded = useExpandedValue(id)
        const switchExpanded = () => isExpanded.value = !isExpanded.value

        const menu = useTagExpandMenu()
        const popup = () => menu.popup(id.value)

        return () => !!props.value.children?.length ? <>
            <p>
                <TagItemElement value={props.value} color={props.color} onContextmenu={popup}/>
                <ExpandButton class="ml-1" isExpanded={isExpanded.value} color={props.color} parentId={id.value} onClick={switchExpanded} onContextmenu={popup}/>
            </p>
            {isExpanded.value && <TagItemList class="ml-6" value={props.value.children ?? []} color={props.color}/>}
        </> : <TagItemElement value={props.value} color={props.color} onContextmenu={popup}/>
    }
})

const ExpandButton = defineComponent({
    props: {
        isExpanded: Boolean,
        color: String,
        parentId: {type: null as any as PropType<number | null>, required: true}
    },
    setup(props) {
        return () => <a class={{"tag": true, "is-light": true, [`is-${props.color}`]: !!props.color}}>
            <i class={`fa fa-angle-${props.isExpanded ? "down" : "right"}`}/>
        </a>
    }
})

const TagItemElement = defineComponent({
    props: {
        value: {type: null as any as PropType<TagTreeNode>, required: true},
        color: String,
    },
    setup(props) {
        const dragEvents = useDraggable("tag", computed(() => ({
            id: props.value.id,
            name: props.value.name,
            color: props.value.color
        })))

        return () => {
            const isAddr = props.value.type !== "TAG"
            const isSequenced = props.value.group === "SEQUENCE" || props.value.group === "FORCE_AND_SEQUENCE"
            const isForced = props.value.group === "FORCE" || props.value.group === "FORCE_AND_SEQUENCE"
            const isGroup = props.value.group !== "NO"

            return <a class={["tag", props.color ? `is-${props.color}` : null, isAddr ? "is-light" : null]} draggable={true} {...dragEvents}>
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

const [installTagExpandMenu, useTagExpandMenu] = installation(function (expandedInfo: ExpandedInfoContext) {
    const expandChildren = (id: number) => expandedInfo.setAllForChildren(id, true)
    const collapseChildren = (id: number) => expandedInfo.setAllForChildren(id, false)

    const menu = usePopupMenu<number>([
        {type: "normal", label: "折叠全部标签", click: collapseChildren},
        {type: "normal", label: "展开全部标签", click: expandChildren}
    ])

    const popup = (id: number) => menu.popup(id)

    return {popup}
})
