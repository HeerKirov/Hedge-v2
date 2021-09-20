import { defineComponent, PropType, watch } from "vue"
import WrappedText from "@/components/elements/WrappedText"
import Starlight from "@/components/elements/Starlight"
import { AnnotationElement } from "@/layouts/display-components"
import TopBarTransparentLayout from "@/layouts/layouts/TopBarTransparentLayout"
import { Link } from "@/functions/adapter-http/impl/generic"
import { DetailAuthor, AuthorType } from "@/functions/adapter-http/impl/author"
import { clientMode, assetsUrl, useElementPopupMenu } from "@/functions/app"
import { openExternal, useMessageBox, writeClipboard } from "@/functions/module"
import { useNavigator } from "@/functions/navigator"
import { arrays } from "@/utils/collections"
import { AUTHOR_TYPE_ENUMS, AUTHOR_TYPE_ICONS, AUTHOR_TYPE_NAMES } from "@/definitions/author"
import { useAuthorContext } from "../inject"
import { useAuthorDetailContext } from "./inject"
import { useSideBarContext } from "../../inject"
import style from "./style.module.scss"

export default defineComponent({
    setup() {
        const { pushSubItem } = useSideBarContext()
        const { data } = useAuthorDetailContext()

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
        const { dataView, detailMode, openCreatePane, closePane } = useAuthorContext()
        const { data, setData, deleteData, editMode } = useAuthorDetailContext()

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
                    annotations: topic.annotations,
                    keywords: topic.keywords,
                    description: topic.description,
                    favorite: topic.favorite,
                    links: topic.links,
                    score: topic.score
                })
            }
        }

        const menu = useElementPopupMenu([
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
        const { data } = useAuthorDetailContext()

        return () => <div class={["container", "p-2", style.detailView]}>
            {data.value && <MainContent data={data.value}/>}
            {data.value?.links.length ? <LinkContent class="mb-1" links={data.value.links}/> : null}
            {data.value && <ExampleContent name={data.value.name}/>}
        </div>
    }
})

const MainContent = defineComponent({
    props: {
        data: {type: null as any as PropType<DetailAuthor>, required: true}
    },
    setup(props) {
        return () => <div class="box mb-1">
            <p>
                <span class={["icon", "is-size-large", `has-text-${props.data.color}`, "mr-1"]}><i class="fa fa-user-tag"/></span>
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
                {props.data.annotations.map(annotation => <AnnotationElement value={annotation} class="mr-1 mb-1" canBeSelected={true}/>)}
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
        const navigator = useNavigator()
        const { exampleData } = useAuthorDetailContext()

        const more = () => navigator.goto.main.illusts({topicName: props.name})

        return () => exampleData.value?.total ? <div class={style.examples}>
            {exampleData.value!.result.map(illust => <div class={style.example}><img src={assetsUrl(illust.thumbnailFile)} alt="example"/></div>)}
            <div class={style.more}>
                <a class="no-wrap" onClick={more}>在图库搜索"{props.name}"的全部项目<i class="fa fa-angle-double-right ml-1 mr-1"/></a>
            </div>
        </div> : <div/>
    }
})

const TYPE_ITEM_ELEMENTS: {[type in AuthorType]: JSX.Element} = arrays.toMap(AUTHOR_TYPE_ENUMS, type => <><i class={`fa fa-${AUTHOR_TYPE_ICONS[type]} mr-2`}/><span class="mr-2">{AUTHOR_TYPE_NAMES[type]}</span></>)
