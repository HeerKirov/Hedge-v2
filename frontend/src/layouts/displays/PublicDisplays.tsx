import { computed, defineComponent, PropType } from "vue"
import WrappedText from "@/components/elements/WrappedText"
import Starlight from "@/components/elements/Starlight"
import { SimpleMetaTagElement } from "@/layouts/elements"
import { useMetaTagCallout } from "@/layouts/data/MetaTagCallout"
import { SimpleAuthor, SimpleTopic, SimpleTag, MetaTagTypes, MetaTagTypeValues } from "@/functions/adapter-http/impl/all"
import { Tagme } from "@/functions/adapter-http/impl/illust"
import { useRouterNavigator } from "@/functions/feature/router"
import { usePopupMenu } from "@/functions/module/popup-menu"
import { writeClipboard } from "@/functions/module/others"
import { date, datetime, LocalDate, LocalDateTime } from "@/utils/datetime"

/**
 * 用于Tagme展示。形态是一个简短的tag，每种tagme显示为一个icon。适合表单、侧边栏、顶栏。在无内容时仍显示[无]字样。
 */
export const TagmeInfo = defineComponent({
    props: {
        value: null as any as PropType<Tagme[]>
    },
    setup(props) {
        return () => {
            const valueList = TAGME_LIST.filter(tagme => props.value?.includes(tagme))
            return <span class="tag">
                <span>Tagme</span>
                {valueList.length ? valueList.map(tagme => ICONS[tagme]) : <i class="ml-1">无</i>}
            </span>
        }
    }
})

const TAGME_LIST: Tagme[] = ["TAG", "AUTHOR", "TOPIC", "SOURCE"]

const ICONS: {[tagme in Tagme]: JSX.Element} = {
    "TAG": <i class="fa fa-tag ml-1"/>,
    "AUTHOR": <i class="fa fa-user-tag ml-1"/>,
    "TOPIC": <i class="fa fa-hashtag ml-1"/>,
    "SOURCE": <i class="fa fa-pager ml-1"/>
}

/**
 * [标题]属性组件。在无内容时显示[没有标题]。
 */
export function TitleDisplay({ value }: {value: string | null}) {
    return value ? <p class="py-1 is-size-medium can-be-selected">{value}</p> : <p class="py-1"><i class="has-text-grey">没有标题</i></p>
}

/**
 * [描述]属性组件。在无内容时显示[没有描述]。
 */
export function DescriptionDisplay(props: {value: string | null}) {
    return props.value ? <WrappedText value={props.value}/> : <p><i class="has-text-grey">没有描述</i></p>
}

/**
 * 评分展示组件。在无评分时显示[评分空缺]。
 */
export function ScoreDisplay(props: {value: number | null}) {
    return props.value !== null
        ? <Starlight value={props.value} showText={true}/>
        : <div class="has-text-grey"><i class="fa fa-star-half"/><i>评分空缺</i></div>
}

/**
 * illust/album等的业务时间展示组件。
 */
export function TimeDisplay(props: {orderTime?: LocalDateTime, createTime?: LocalDateTime, updateTime?: LocalDateTime}) {
    const showUpdateTime = props.updateTime && (props.createTime === undefined || props.updateTime.timestamp !== props.createTime.timestamp)
    return <div class="pt-1">
        {props.orderTime && <p class="has-text-grey">排序时间 {datetime.toSimpleFormat(props.orderTime)}</p>}
        {props.createTime && <p class="has-text-grey">添加时间 {datetime.toSimpleFormat(props.createTime)}</p>}
        {showUpdateTime && <p class="has-text-grey">上次修改 {datetime.toSimpleFormat(props.updateTime!)}</p>}
    </div>
}

/**
 * 分区时间显示组件。同时提供右键菜单。
 */
export const PartitionTimeDisplay = defineComponent({
    props: {
        partitionTime: {type: null as any as PropType<LocalDate>, required: true}
    },
    setup(props) {
        const navigator = useRouterNavigator()
        const text = computed(() => date.toISOString(props.partitionTime))

        const openPartition = () => navigator.goto({routeName: "MainPartitions", query: {detail: props.partitionTime}})
        const openPartitionInNewWindow = () => navigator.newWindow({routeName: "MainPartitions", query: {detail: props.partitionTime}})
        const menu = usePopupMenu([
            {type: "normal", "label": "查看时间分区", click: openPartition},
            {type: "normal", "label": "在新窗口中打开时间分区", click: openPartitionInNewWindow}
        ])

        return () => <p class="pt-1 has-text-grey" onContextmenu={() => menu.popup()}>时间分区 {text.value}</p>
    }
})

/**
 * illust/album等的元数据标签展示列表。同时提供右键菜单和callout注入。
 */
export const MetaTagListDisplay = defineComponent({
    props: {
        authors: {type: Array as PropType<SimpleAuthor[]>, required: true},
        topics: {type: Array as PropType<SimpleTopic[]>, required: true},
        tags: {type: Array as PropType<SimpleTag[]>, required: true},
    },
    setup(props) {
        const metaTagCallout = useMetaTagCallout()
        const navigator = useRouterNavigator()

        const openMetaTagDetail = ({ type, value }: MetaTagTypeValues) => {
            if(type === "tag") navigator.goto({routeName: "MainTags", query: {detail: value.id}})
            else if(type === "topic") navigator.goto({routeName: "MainTopics", query: {detail: value.id}})
            else if(type === "author") navigator.goto({routeName: "MainAuthors", query: {detail: value.id}})
        }
        const openMetaTagDetailInNewWindow = ({ type, value }: MetaTagTypeValues) => {
            if(type === "tag") navigator.newWindow({routeName: "MainTags", query: {detail: value.id}})
            else if(type === "topic") navigator.newWindow({routeName: "MainTopics", query: {detail: value.id}})
            else if(type === "author") navigator.newWindow({routeName: "MainAuthors", query: {detail: value.id}})
        }
        const searchInIllusts = ({ type, value }: MetaTagTypeValues) => {
            if(type === "tag") navigator.goto({routeName: "MainIllusts", params: {tagName: value.name}})
            else if(type === "topic") navigator.goto({routeName: "MainIllusts", params: {topicName: value.name}})
            else if(type === "author") navigator.goto({routeName: "MainIllusts", params: {authorName: value.name}})
        }
        const searchInAlbums = ({ type, value }: MetaTagTypeValues) => {
            if(type === "tag") navigator.goto({routeName: "MainAlbums", params: {tagName: value.name}})
            else if(type === "topic") navigator.goto({routeName: "MainAlbums", params: {topicName: value.name}})
            else if(type === "author") navigator.goto({routeName: "MainAlbums", params: {authorName: value.name}})
        }
        const copyMetaTagName = ({ value }: MetaTagTypeValues) => writeClipboard(value.name)

        const menu = usePopupMenu<MetaTagTypeValues>([
            {type: "normal", "label": "查看标签详情", click: openMetaTagDetail},
            {type: "normal", "label": "在新窗口中打开标签详情", click: openMetaTagDetailInNewWindow},
            {type: "separator"},
            {type: "normal", "label": "在图库中搜索", click: searchInIllusts},
            {type: "normal", "label": "在画集中搜索", click: searchInAlbums},
            {type: "normal", "label": "复制此标签的名称", click: copyMetaTagName},
        ])

        const onClick = (type: MetaTagTypes, id: number) => (e: MouseEvent) => {
            const el = (e.currentTarget as Element)
            metaTagCallout.open(el.getBoundingClientRect(), type, id)
        }

        return () => !props.tags.length && !props.authors.length && !props.topics.length ? <div class="has-text-grey mt-1">
            <i>没有元数据标签</i>
        </div> : <div class="mt-half">
            {props.authors.map(author => <SimpleMetaTagElement class="mt-half" key={`author-${author.id}`} type="author" value={author} onClick={onClick("author", author.id)} onContextmenu={() => menu.popup({type: "author", value: author})} wrappedByDiv={true}/>)}
            {props.topics.map(topic => <SimpleMetaTagElement class="mt-half" key={`topic-${topic.id}`} type="topic" value={topic} onClick={onClick("topic", topic.id)} onContextmenu={() => menu.popup({type: "topic", value: topic})} wrappedByDiv={true}/>)}
            {props.tags.map(tag => <SimpleMetaTagElement class="mt-half" key={`tag-${tag.id}`} type="tag" value={tag} onClick={onClick("tag", tag.id)} onContextmenu={() => menu.popup({type: "tag", value: tag})} wrappedByDiv={true}/>)}
        </div>
    }
})
