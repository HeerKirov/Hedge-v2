import { computed, defineComponent, toRef } from "vue"
import Starlight from "@/components/elements/Starlight"
import WrappedText from "@/components/elements/WrappedText"
import PopupBox from "@/layouts/layouts/PopupBox"
import { AnnotationElement } from "@/layouts/elements"
import { TagExampleDisplay, TagGroupDisplay, TagGroupMemberDisplay, TagLinkDisplay } from "@/layouts/displays"
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

        return () => context.base.value && <PopupBox base={context.base.value} onClose={context.close}
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
        </PopupBox>
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
            {data.value.parents.length > 0 && <div class="mt-1">
                <i class="fa fa-chess-queen mr-2"/><span>父主题</span>
                {data.value.parents.map(parent => <a class={["tag", "ml-2", "is-light", `is-${parent.color}`]}>
                    {TOPIC_TYPE_ICON_ELEMENTS[parent.type]}
                    {parent.name}
                </a>)}
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

        const computedInfo = computed<{address: string | null, member: boolean, memberIndex: number | null}>(() => {
            if(data.value !== null && data.value.parents.length) {
                const address = data.value.parents.map(i => i.name).join(".")
                const parent = data.value.parents[data.value.parents.length - 1]
                const member = parent.group !== "NO"
                const memberIndex = parent.group === "SEQUENCE" ? data.value.ordinal + 1 : null

                return {address, member, memberIndex}
            }else{
                return {address: null, member: false, memberIndex: null}
            }
        })

        return () => data.value && <>
            {computedInfo.value.address && <p class="can-be-selected">{computedInfo.value.address}</p>}
            <p>
                <span class={["icon", "is-size-medium", `has-text-${data.value.color}`, "mr-1"]}><i class="fa fa-tag"/></span>
                <span class="can-be-selected">
                    <b class={["is-size-5", `has-text-${data.value.color}`]}>{data.value.name}</b>
                    <i class="ml-1 has-text-grey">{data.value.otherNames.join(" / ")}</i>
                </span>
            </p>
            {(data.value.group !== "NO" || null) && <TagGroupDisplay class="mt-1" value={data.value.group}/>}
            <TagGroupMemberDisplay class="mt-1" member={computedInfo.value.member} memberIndex={computedInfo.value.memberIndex ?? undefined}/>
            {(data.value.annotations.length || null) && <div class="mt-1">
                {data.value.annotations.map(a => <AnnotationElement key={a.id} value={a}/>)}
            </div>}
            {(data.value.description || null) && <div class="py-2">
                <WrappedText value={data.value.description}/>
            </div>}
            {(data.value.links.length || null) && <div class="mt-2">
                <TagLinkDisplay value={data.value.links}/>
            </div>}
            {data.value.score ? <p class="mt-2"><Starlight value={data.value.score} showText={true}/></p> : null}
            {(data.value.examples.length || null) && <div class="mt-2">
                <label class="label">示例</label>
                <TagExampleDisplay value={data.value.examples} columnNum={3}/>
            </div>}
        </>
    }
})

const AUTHOR_TYPE_ITEM_ELEMENTS: {[type in AuthorType]: JSX.Element} = arrays.toMap(AUTHOR_TYPE_ENUMS, type => <><i class={`fa fa-${AUTHOR_TYPE_ICONS[type]} mr-2`}/><span class="mr-2">{AUTHOR_TYPE_NAMES[type]}</span></>)
const TOPIC_TYPE_ITEM_ELEMENTS: {[type in TopicType]: JSX.Element} = arrays.toMap(TOPIC_TYPE_ENUMS, type => <><i class={`fa fa-${TOPIC_TYPE_ICONS[type]} mr-2`}/><span class="mr-2">{TOPIC_TYPE_NAMES[type]}</span></>)
const TOPIC_TYPE_ICON_ELEMENTS: {[type in TopicType]: JSX.Element} = arrays.toMap(TOPIC_TYPE_ENUMS, type => <i class={`fa fa-${TOPIC_TYPE_ICONS[type]} mr-1`}/>)
