import { defineComponent, toRef } from "vue"
import Starlight from "@/components/elements/Starlight"
import WrappedText from "@/components/elements/WrappedText"
import CalloutBox from "@/layouts/layouts/CalloutBox"
import { AnnotationElement, TagGroupDisplay, TagGroupMemberDisplay, TagTypeDisplay } from "@/layouts/display-components"
import { TOPIC_TYPE_ENUMS, TOPIC_TYPE_ICONS, TOPIC_TYPE_NAMES } from "@/definitions/topic"
import { AUTHOR_TYPE_ENUMS, AUTHOR_TYPE_ICONS, AUTHOR_TYPE_NAMES } from "@/definitions/author"
import { useObjectEndpoint } from "@/functions/utils/endpoints/object-endpoint"
import { TopicType } from "@/functions/adapter-http/impl/topic"
import { AuthorType } from "@/functions/adapter-http/impl/author"
import { arrays } from "@/utils/collections"
import { installMetaTagCallout, useMetaTagCallout } from "./inject"

export { installMetaTagCallout, useMetaTagCallout }

const WIDTH = 350, HEIGHT = 200
const css = {"width": `${WIDTH}px`, "maxHeight": `${HEIGHT}px`}

export default defineComponent({
    setup() {
        const context = useMetaTagCallout()

        return () => context.base.value && <CalloutBox base={context.base.value} onClose={context.close}
                                                       position="right-top" width={WIDTH} height={HEIGHT}
                                                       alignOffset={16} directionOffset={32} directionOffsetMin={16}>
            <div class="popup-block is-overflow-y-auto p-3" style={css}>
                {context.target.value!.type === "topic" ?
                    <TopicDetail id={context.target.value!.id}/>
                : context.target.value!.type === "author" ?
                    <AuthorDetail id={context.target.value!.id}/>
                : //tag
                    <TagDetail id={context.target.value!.id}/>
                }
            </div>
        </CalloutBox>
    }
})

const TopicDetail = defineComponent({
    props: {
        id: {type: Number, required: true}
    },
    setup(props) {
        const { data } = useObjectEndpoint({
            path: toRef(props, "id"),
            get: httpClient => httpClient.topic.get
        })

        return () => data.value && <>
            <p>
                <span class={["icon", "is-size-large", `has-text-${data.value.color}`, "mr-1"]}><i class="fa fa-user-tag"/></span>
                <span class="can-be-selected">
                    <b class={["is-size-4", `has-text-${data.value.color}`]}>{data.value.name}</b>
                    <i class="ml-1 has-text-grey">{data.value.otherNames.join(" / ")}</i>
                </span>
            </p>
            <p class="is-size-7 mt-2">
                {TOPIC_TYPE_ITEM_ELEMENTS[data.value.type]}
            </p>
            {data.value.parent && <div class="mt-1">
                <i class="fa fa-chess-queen mr-2"/><span>父主题</span>
                <a class={["tag", "ml-2", "is-light", `is-${data.value.parent.color}`]}>
                    {TOPIC_TYPE_ICON_ELEMENTS[data.value.parent.type]}
                    {data.value.parent.name}
                </a>
            </div>}
            <p class="mt-2">
                {data.value.annotations.map(annotation => <AnnotationElement value={annotation} class="mr-1 mb-1" canBeSelected={true}/>)}
                {data.value.keywords.map(keyword => <span class="can-be-selected tag mr-1 mb-1">{keyword}</span>)}
            </p>
            {(data.value.description || null) && <div class="py-2">
                <WrappedText value={data.value.description}/>
            </div>}
            {data.value.score ? <p class="mt-2"><Starlight value={data.value.score} showText={true}/></p> : null}
        </>
    }
})

const AuthorDetail = defineComponent({
    props: {
        id: {type: Number, required: true}
    },
    setup(props) {
        const { data } = useObjectEndpoint({
            path: toRef(props, "id"),
            get: httpClient => httpClient.author.get
        })

        return () => data.value && <>
            <p>
                <span class={["icon", "is-size-large", `has-text-${data.value.color}`, "mr-1"]}><i class="fa fa-user-tag"/></span>
                <span class="can-be-selected">
                    <b class={["is-size-4", `has-text-${data.value.color}`]}>{data.value.name}</b>
                    <i class="ml-1 has-text-grey">{data.value.otherNames.join(" / ")}</i>
                </span>
            </p>
            <p class="is-size-7 mt-2">
                {AUTHOR_TYPE_ITEM_ELEMENTS[data.value.type]}
            </p>
            <p class="mt-2">
                {data.value.annotations.map(annotation => <AnnotationElement value={annotation} class="mr-1 mb-1" canBeSelected={true}/>)}
                {data.value.keywords.map(keyword => <span class="can-be-selected tag mr-1 mb-1">{keyword}</span>)}
            </p>
            {(data.value.description || null) && <div class="py-2">
                <WrappedText value={data.value.description}/>
            </div>}
            {data.value.score ? <p class="mt-2"><Starlight value={data.value.score} showText={true}/></p> : null}
        </>
    }
})

const TagDetail = defineComponent({
    props: {
        id: {type: Number, required: true}
    },
    setup(props) {
        const { data } = useObjectEndpoint({
            path: toRef(props, "id"),
            get: httpClient => httpClient.tag.get
        })

        return () => data.value && <>
            {/* TODO 需要调整API，从detail API中获得parent list，以构建address */}
            <p>
                <span class={["icon", "is-size-medium", `has-text-${data.value.color}`, "mr-1"]}><i class="fa fa-tag"/></span>
                <span class="can-be-selected">
                    <b class={["is-size-5", `has-text-${data.value.color}`]}>{data.value.name}</b>
                    <i class="ml-1 has-text-grey">{data.value.otherNames.join(" / ")}</i>
                </span>
            </p>
            <TagGroupDisplay class="mt-1" value={data.value.group}/>
            <TagGroupMemberDisplay class="mt-1" member={false} memberIndex={undefined}/>{/* TODO 同样，需要调整API，从detail API中获得group member信息 */}
            {(data.value.annotations.length || null) && <p class="mt-1">
                {data.value.annotations.map(a => <AnnotationElement key={a.id} value={a}/>)}
            </p>}
            {(data.value.description || null) && <div class="py-2">
                <WrappedText value={data.value.description}/>
            </div>}
            {/* TODO 同样，需要调整API，从detail API中获得完整的tag link信息而不必查缓存。此外将TagLinkDisplay抽离为公共组件 */}
            {data.value.score ? <p class="mt-2"><Starlight value={data.value.score} showText={true}/></p> : null}
        </>
    }
})

const AUTHOR_TYPE_ITEM_ELEMENTS: {[type in AuthorType]: JSX.Element} = arrays.toMap(AUTHOR_TYPE_ENUMS, type => <><i class={`fa fa-${AUTHOR_TYPE_ICONS[type]} mr-2`}/><span class="mr-2">{AUTHOR_TYPE_NAMES[type]}</span></>)
const TOPIC_TYPE_ITEM_ELEMENTS: {[type in TopicType]: JSX.Element} = arrays.toMap(TOPIC_TYPE_ENUMS, type => <><i class={`fa fa-${TOPIC_TYPE_ICONS[type]} mr-2`}/><span class="mr-2">{TOPIC_TYPE_NAMES[type]}</span></>)
const TOPIC_TYPE_ICON_ELEMENTS: {[type in TopicType]: JSX.Element} = arrays.toMap(TOPIC_TYPE_ENUMS, type => <i class={`fa fa-${TOPIC_TYPE_ICONS[type]} mr-1`}/>)
