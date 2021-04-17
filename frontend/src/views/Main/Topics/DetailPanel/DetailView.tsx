import { defineComponent, PropType } from "vue"
import WrappedText from "@/components/elements/WrappedText"
import Starlight from "@/components/elements/Starlight"
import { Link } from "@/functions/adapter-http/impl/generic"
import { DetailTopic, TopicType } from "@/functions/adapter-http/impl/topic"
import { clientMode, assetsUrl } from "@/functions/app"
import { openExternal } from "@/functions/module"
import { useNavigator } from "@/functions/navigator"
import { arrays } from "@/utils/collections"
import { useTopicContext } from "../inject"
import { useTopicDetailContext } from "./inject"
import { TOPIC_TYPE_ENUMS, TOPIC_TYPE_ICONS, TOPIC_TYPE_NAMES } from "../define"
import style from "./style.module.scss"

export default defineComponent({
    setup() {
        const { data } = useTopicDetailContext()

        return () => <div class={["container", "p-2", style.detailView]}>
            <div class="box mb-1">
                {data.value && <MainContent data={data.value}/>}
                <SubThemeContent/>
                {data.value?.score ? <p class="mt-3"><Starlight value={data.value.score} showText={true}/></p> : null}
            </div>
            {data.value?.links.length ? <LinkContent class="mb-1" links={data.value.links}/> : null}
            {data.value && <ExampleContent name={data.value.name}/>}
        </div>
    }
})

const MainContent = defineComponent({
    props: {
        data: {type: null as any as PropType<DetailTopic>, required: true}
    },
    setup(props) {
        const { openDetailPane } = useTopicContext()

        return () => <>
            <p>
                <span class="icon is-size-large"><i class="fa fa-hashtag"/></span>
                <span class="can-be-selected">
                        <b class="is-size-4">{props.data.name}</b>
                        <i class="ml-1 has-text-grey">{props.data.otherNames.join(" / ")}</i>
                    </span>
            </p>
            <p class="is-size-7 mt-2">
                {TYPE_ITEM_ELEMENTS[props.data.type]}
            </p>
            <p class="mt-2">
                {props.data.annotations.map(annotation => <span class="tag mr-1">[ {annotation.name} ]</span>)}
            </p>
            <p class="mt-1">
                {props.data.keywords.map(keyword => <span class="tag mr-1">{keyword}</span>)}
            </p>
            <p class="mt-3 mb-6">
                <WrappedText value={props.data.description}/>
            </p>
            {props.data.parent && <div class="mt-1">
                <div class="mb-1"><i class="fa fa-chess-queen mr-2"/><span>父主题</span></div>
                <div>
                    <a class="tag mr-1 mb-1" onClick={() => openDetailPane(props.data.parent!.id)}>
                        {TYPE_ICON_ELEMENTS[props.data.parent.type]}
                        {props.data.parent.name}
                    </a>
                </div>
            </div>}
        </>
    }
})

const SubThemeContent = defineComponent({
    setup() {
        const navigator = useNavigator()
        const { detailMode, openDetailPane } = useTopicContext()
        const { subThemeData } = useTopicDetailContext()

        const more = () => {
            navigator.goto.main.topics({parentId: detailMode.value!})
        }

        return () => subThemeData.value?.total ? <div class="mt-1">
            <div class="mb-1"><i class="fa fa-chess mr-2"/><span>子主题</span></div>
            <div>
                {subThemeData.value!.result.map(topic => <a class="tag mr-1 mb-1" onClick={() => openDetailPane(topic.id)}>
                    {TYPE_ICON_ELEMENTS[topic.type]}
                    {topic.name}
                </a>)}
                <p>
                    <a class="no-wrap mb-1" onClick={more}>在主题列表搜索全部子主题<i class="fa fa-angle-double-right ml-1"/></a>
                </p>
            </div>
        </div> : <div/>
    }
})

const LinkContent = defineComponent({
    props: {
        links: {type: null as any as PropType<Link[]>, required: true}
    },
    setup(props) {
        const createLink = clientMode ? function (link: Link) {
            return <a onClick={() => openExternal(link.link)}><i class="fa fa-link mr-1"/>{link.title}</a>
        } : function (link: Link) {
            return <a href={link.link} target="_blank"><i class="fa fa-link mr-1"/>{link.title}</a>
        }

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
        const { detailMode } = useTopicContext()
        const { exampleData } = useTopicDetailContext()

        const more = () => {
            navigator.goto.main.illusts({topicName: props.name})
        }

        return () => exampleData.value?.total ? <div class={style.examples}>
            {exampleData.value!.result.map(illust => <div class={style.example}><img src={assetsUrl(illust.thumbnailFile)} alt="example"/></div>)}
            <div class={style.more}>
                <a class="no-wrap" onClick={more}>在图库搜索"{props.name}"的全部项目<i class="fa fa-angle-double-right ml-1 mr-1"/></a>
            </div>
        </div> : <div/>
    }
})

const TYPE_ITEM_ELEMENTS: {[type in TopicType]: JSX.Element} =
    arrays.toMap(TOPIC_TYPE_ENUMS, type => <><i class={`fa fa-${TOPIC_TYPE_ICONS[type]} mr-2`}/><span class="mr-2">{TOPIC_TYPE_NAMES[type]}</span></>)

const TYPE_ICON_ELEMENTS: {[type in TopicType]: JSX.Element} =
    arrays.toMap(TOPIC_TYPE_ENUMS, type => <i class={`fa fa-${TOPIC_TYPE_ICONS[type]} mr-1`}/>)
