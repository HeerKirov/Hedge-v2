import { computed, defineComponent, PropType, Ref, SetupContext, watch } from "vue"
import WrappedText from "@/components/elements/WrappedText"
import Starlight from "@/components/elements/Starlight"
import GridImage from "@/components/elements/GridImage"
import TopBarTransparentLayout from "@/components/layouts/TopBarTransparentLayout"
import { SourceTagMappingsDisplay } from "@/layouts/displays"
import { AnnotationElement } from "@/layouts/elements"
import { Link } from "@/functions/adapter-http/impl/generic"
import { DetailTopic, ParentTopic, SimpleTopic, TopicChildrenNode, TopicType } from "@/functions/adapter-http/impl/topic"
import { SourceMappingMetaItem } from "@/functions/adapter-http/impl/source-tag-mapping"
import { clientMode, useLocalStorageWithDefault } from "@/services/app"
import { useElementPopupMenu } from "@/services/module/popup-menu"
import { useMessageBox } from "@/services/module/message-box"
import { openExternal, writeClipboard } from "@/services/module/others"
import { useRouterNavigator } from "@/services/global/router"
import { arrays } from "@/utils/collections"
import { TOPIC_TYPE_ENUMS, TOPIC_TYPE_ICONS, TOPIC_TYPE_NAMES } from "@/definitions/topic"
import { useTopicContext } from "../inject"
import { useTopicDetailContext } from "./inject"
import { useSideBarContext } from "../../inject"
import style from "./style.module.scss"

export default defineComponent({
    setup() {
        const { pushSubItem } = useSideBarContext()
        const { data } = useTopicDetailContext()

        watch(data, d => {
            if(d != null) {
                pushSubItem(d.id.toString(), d.name)
            }
        })

        return () => <TopBarTransparentLayout paddingForTopBar={true} scrollable={true} v-slots={{
            topBar: () => <TopBarContent/>,
            default: () => <Panel/>
        }}/>
    }
})

const TopBarContent = defineComponent({
    setup() {
        const messageBox = useMessageBox()
        const { dataView, detailMode, openCreatePane, closePane } = useTopicContext()
        const { data, setData, deleteData, editMode } = useTopicDetailContext()

        const edit = () => editMode.value = true

        const switchFavorite = () => setData({favorite: !data.value?.favorite})

        const deleteItem = async () => {
            const id = detailMode.value!
            if(await messageBox.showYesNoMessage("warn", "确定要删除此项吗？", "此操作不可撤回。")) {
                if(await deleteData()) {
                    closePane()
                    const index = dataView.proxy.syncOperations.find(topic => topic.id === id)
                    if(index != undefined) dataView.proxy.syncOperations.remove(index)
                }
            }
        }

        const createByItem = async () => {
            const topic = data.value
            if(topic != undefined) {
                openCreatePane({
                    name: topic.name,
                    otherNames: topic.otherNames,
                    type: topic.type,
                    parents: topic.parents,
                    annotations: topic.annotations,
                    keywords: topic.keywords,
                    description: topic.description,
                    favorite: topic.favorite,
                    links: topic.links,
                    score: topic.score
                })
            }
        }

        const createSubOfItem = () => {
            const topic = data.value
            if(topic != undefined) {
                openCreatePane({
                    parents: [{
                        id: topic.id,
                        name: topic.name,
                        type: topic.type,
                        color: topic.color
                    }]
                })
            }
        }

        const menu = useElementPopupMenu([
            {type: "normal", label: "新建子主题", click: createSubOfItem},
            {type: "normal", label: "以此为模板新建", click: createByItem},
            {type: "separator"},
            {type: "normal", label: "删除此主题", click: deleteItem}
        ], {position: "bottom", align: "center", offsetY: 5})

        return () => <div class="middle-layout">
            <div class="layout-container">
                <button class="square button no-drag radius-large is-white" onClick={closePane}>
                    <span class="icon"><i class="fa fa-arrow-left"/></span>
                </button>
            </div>
            <div class="layout-container">
                <button class={`square button no-drag radius-large is-white ${data.value?.favorite ? "has-text-danger" : "has-text-grey"}`} onClick={switchFavorite}>
                    <span class="icon"><i class="fa fa-heart"/></span>
                </button>
                <div class="separator"/>
                <button class="square button no-drag radius-large is-white mr-1" ref={menu.element} onClick={menu.popup}>
                    <span class="icon"><i class="fa fa-ellipsis-v"/></span>
                </button>
                <button class="square button no-drag radius-large is-white" onClick={edit}>
                    <span class="icon"><i class="fa fa-edit"/></span>
                </button>
            </div>
        </div>
    }
})

const Panel = defineComponent({
    setup() {
        const { data } = useTopicDetailContext()

        return () => <div class="container p-2">
            {data.value && <MainContent data={data.value}/>}
            {data.value && <RelatedTopicContent data={data.value}/>}
            {data.value?.links.length ? <LinkContent class="mb-1" links={data.value.links}/> : null}
            {data.value?.mappingSourceTags.length ? <SourceTagMappingContent class="mb-1" mappings={data.value.mappingSourceTags}/> : null}
            {data.value && <ExampleContent name={data.value.name}/>}
        </div>
    }
})

const MainContent = defineComponent({
    props: {
        data: {type: null as any as PropType<DetailTopic>, required: true}
    },
    setup(props) {
        return () => <div class="box mb-1">
            <p>
                <span class={["icon", "is-size-large", `has-text-${props.data.color}`]}><i class="fa fa-hashtag"/></span>
                <span class="can-be-selected">
                        <b class={["is-size-4", `has-text-${props.data.color}`]}>{props.data.name}</b>
                        <i class="ml-1 has-text-grey">{props.data.otherNames.join(" / ")}</i>
                    </span>
            </p>
            <p class="is-size-7 mt-2">
                {TYPE_ITEM_ELEMENTS[props.data.type]}
            </p>
            <p class="mt-6"/>
            <p class="mt-1">
                {props.data.annotations.map(annotation => <AnnotationElement class="mr-1 mb-1" value={annotation} canBeSelected={true}/>)}
            </p>
            <p>
                {props.data.keywords.map(keyword => <span class="can-be-selected tag mr-1 mb-1">{keyword}</span>)}
            </p>
            {(props.data.description || null) && <div class="block p-3 can-be-selected">
                <WrappedText value={props.data.description}/>
            </div>}
            <p class="mt-4"/>
            {props.data.score ? <p><Starlight value={props.data.score} showText={true}/></p> : null}
        </div>
    }
})

const RelatedTopicContent = defineComponent({
    props: {
        data: {type: null as any as PropType<DetailTopic>, required: true}
    },
    setup(props) {
        const { openDetailPane } = useTopicContext()

        const childrenMode = useLocalStorageWithDefault<"tree" | "list">("topic-detail/children-view-mode", "tree")

        return () => (props.data.children && props.data.children.length > 0 || props.data.parents.length > 0) ? <div class="box mb-1">
            {props.data.parents.length > 0 && <>
                <div class="mt-2 mb-1"><i class="fa fa-chess-queen mr-2"/><span>父主题</span></div>
                <RelatedParentsContent parents={props.data.parents} onClick={openDetailPane}/>
            </>}
            {props.data.children && props.data.children.length > 0 && <>
                <div class="mt-3 mb-1">
                    <i class="fa fa-chess mr-2"/><span>子主题</span>
                    <span class="float-right">
                        <a class={{"has-text-grey": childrenMode.value !== "tree"}} onClick={() => childrenMode.value = "tree"}><i class="fa fa-tree mr-1"/>树形视图</a>
                        <span class="mx-1">|</span>
                        <a class={{"has-text-grey": childrenMode.value !== "list"}} onClick={() => childrenMode.value = "list"}><i class="fa fa-list mr-1"/>列表视图</a>
                    </span>
                </div>
                <RelatedChildrenContent children={props.data.children ?? []} mode={childrenMode.value} onClick={openDetailPane}/>
            </>}
        </div> : <div/>
    }
})

const RelatedParentsContent = defineComponent({
    props: {
        parents: {type: Array as PropType<ParentTopic[]>, required: true}
    },
    emits: {
        click: (_: number) => true
    },
    setup(props, { emit }) {
        return () => <div>
            {props.parents.map(topic => <a key={topic.id} class={["tag", "mr-1", "mb-1", "is-light", `is-${topic.color}`]} onClick={() => emit("click", topic.id)}>
                {TYPE_ICON_ELEMENTS[topic.type]}
                {topic.name}
            </a>)}
        </div>
    }
})

const RelatedChildrenContent = defineComponent({
    props: {
        children: {type: Array as PropType<TopicChildrenNode[]>, required: true},
        mode: {type: String as PropType<"tree" | "list">, required: true}
    },
    emits: {
        click: (_: number) => true
    },
    setup(props, { emit }) {
        const list: Ref<{[key in TopicType]: SimpleTopic[]}> = computed(() => {
            const workList: SimpleTopic[] = []
            const characterList: SimpleTopic[] = []
            const unknownList: SimpleTopic[] = []

            function recursive(children: TopicChildrenNode[]) {
                for (const child of children) {
                    if(child.type === "WORK") workList.push(child)
                    else if(child.type === "CHARACTER") characterList.push(child)
                    else if(child.type === "UNKNOWN") unknownList.push(child)
                    if(child.type !== "CHARACTER" && child.children?.length) recursive(child.children)
                }
            }
             recursive(props.children)

            return {
                "COPYRIGHT": [],
                "WORK": workList,
                "CHARACTER": characterList,
                "UNKNOWN": unknownList
            }
        })

        return () => props.mode === "list" ? <>
            <div>
                {list.value!["WORK"].map(topic => <a key={topic.id} class={["tag", "mr-1", "mb-1", "is-light", `is-${topic.color}`]} onClick={() => emit("click", topic.id)}>
                    {TYPE_ICON_ELEMENTS[topic.type]}
                    {topic.name}
                </a>)}
            </div>
            <div>
                {list.value!["CHARACTER"].map(topic => <a key={topic.id} class={["tag", "mr-1", "mb-1", "is-light", `is-${topic.color}`]} onClick={() => emit("click", topic.id)}>
                    {TYPE_ICON_ELEMENTS[topic.type]}
                    {topic.name}
                </a>)}
            </div>
            <div>
                {list.value!["UNKNOWN"].map(topic => <a key={topic.id} class={["tag", "mr-1", "mb-1", "is-light", `is-${topic.color}`]} onClick={() => emit("click", topic.id)}>
                    {TYPE_ICON_ELEMENTS[topic.type]}
                    {topic.name}
                </a>)}
            </div>
        </> : <RelatedChildrenList children={props.children} onClick={i => emit("click", i)}/>
    }
})

const RelatedChildrenList = defineComponent({
    props: {
        children: {type: Array as PropType<TopicChildrenNode[]>, required: true}
    },
    emits: {
        click: (_: number) => true
    },
    setup(props, { emit }) {
        //分离work和character，work动态决定是multiLine还是inline，character放在最后总是inline
        const [characters, others] = arrays.filterInfo(props.children, i => i.type === "CHARACTER")
        //others中存在嵌套的列表
        const hasAnyChildren = others.some(child => child.children?.length)

        return () => hasAnyChildren ? <div>
            <div class={style.childrenList}>
                {others.map(child => <div key={child.id} class={style.child}><RelatedChildrenListItem child={child} onClick={i => emit("click", i)}/></div>)}
            </div>
            {characters.length > 0 && <div class={[style.childrenList, style.inline]}>
                {characters.map(child => <RelatedChildrenListItem class={style.child} key={child.id} child={child} onClick={i => emit("click", i)}/>)}
            </div>}
        </div> : <div class={[style.childrenList, style.inline]}>
            {[...others, ...characters].map(child => <RelatedChildrenListItem class={style.child} key={child.id} child={child} onClick={i => emit("click", i)}/>)}
        </div>
    }
})

const RelatedChildrenListItem = defineComponent({
    props: {
        child: {type: Object as PropType<TopicChildrenNode>, required: true}
    },
    emits: {
        click: (_: number) => true
    },
    setup(props, { emit }) {
        return () => (props.child.type !== "CHARACTER" && !!props.child.children?.length) ? (<>
            <p><RelatedItemElement topic={props.child} onClick={() => emit("click", props.child.id)}/></p>
            <RelatedChildrenList class="ml-6" children={props.child.children}/>
        </>) : (
            <RelatedItemElement topic={props.child} onClick={() => emit("click", props.child.id)}/>
        )
    }
})

function RelatedItemElement({ topic }: {topic: SimpleTopic}, { emit }: SetupContext<{click()}>) {
    return <a key={topic.id} class={["tag", "mr-1", "mb-1", "is-light", `is-${topic.color}`]} onClick={() => emit("click")}>
        {TYPE_ICON_ELEMENTS[topic.type]}
        {topic.name}
    </a>
}

const LinkContent = defineComponent({
    props: {
        links: {type: null as any as PropType<Link[]>, required: true}
    },
    setup(props) {
        const createLink = clientMode ? function (link: Link) {
            return <a onClick={() => openExternal(link.link)} onContextmenu={() => popupmenu.popup(link.link)}><i class="fa fa-link mr-1"/>{link.title}</a>
        } : function (link: Link) {
            return <a href={link.link} target="_blank"><i class="fa fa-link mr-1"/>{link.title}</a>
        }

        const popupmenu = useElementPopupMenu([
            {type: "normal", label: "复制链接", click: writeClipboard},
        ], {position: "bottom", align: "center", offsetY: 5})

        return () => <div class="box">
            <span class="mr-2">相关链接:</span>
            {props.links.flatMap((link, i) => [
                i > 0 ? <span class="mx-2">|</span> : null,
                createLink(link)
            ])}
        </div>
    }
})

const ExampleContent = defineComponent({
    props: {
        name: {type: String, required: true},
    },
    setup(props) {
        const navigator = useRouterNavigator()
        const { exampleData } = useTopicDetailContext()

        const more = () => navigator.goto({routeName: "MainIllusts", params: {topicName: props.name}})

        return () => exampleData.value?.total ? <div>
            <GridImage value={exampleData.value!.result.map(i => i.thumbnailFile)} columnNum={5} radius="std" boxShadow={true}/>
            <div class="w-100 has-text-right">
                <a class="no-wrap" onClick={more}>在图库搜索"{props.name}"的全部项目<i class="fa fa-angle-double-right ml-1 mr-1"/></a>
            </div>
        </div> : <div/>
    }
})

const SourceTagMappingContent = defineComponent({
    props: {
        mappings: {type: Array as PropType<SourceMappingMetaItem[]>, required: true}
    },
    setup(props) {
        return () => <div class="box">
            <span class="label">来源映射</span>
            <SourceTagMappingsDisplay value={props.mappings} direction="horizontal"/>
        </div>
    }
})

const TYPE_ITEM_ELEMENTS: {[type in TopicType]: JSX.Element} =
    arrays.toMap(TOPIC_TYPE_ENUMS, type => <><i class={`fa fa-${TOPIC_TYPE_ICONS[type]} mr-2`}/><span class="mr-2">{TOPIC_TYPE_NAMES[type]}</span></>)

const TYPE_ICON_ELEMENTS: {[type in TopicType]: JSX.Element} =
    arrays.toMap(TOPIC_TYPE_ENUMS, type => <i class={`fa fa-${TOPIC_TYPE_ICONS[type]} mr-1`}/>)
