import { defineComponent, ref, watch } from "vue"
import { SearchPicker, SearchRequestFunction } from "@/components/features/SearchPicker"
import { DataRouter, SearchBox, AddOnFilter, AddOnTemplate } from "@/layouts/topbar-components"
import { ParentTopic, TopicQueryFilter, TopicType } from "@/functions/adapter-http/impl/topic"
import { SimpleAnnotation } from "@/functions/adapter-http/impl/annotations"
import { watchNavigatorEvent } from "@/functions/navigator"
import { TOPIC_TYPE_ENUMS_WITHOUT_UNKNOWN, TOPIC_TYPE_ICONS, TOPIC_TYPE_NAMES } from "@/definitions/topic"
import { useTopicContext } from "../inject"

export default defineComponent({
    setup() {
        const addOnFilter = ref<AddOnFilterType>({...addOnFilterDefault})

        const clear = () => addOnFilter.value = {...addOnFilterDefault}

        watchNavigatorEvent("MainTopics", (params: {parent?: ParentTopic}) => {
            if(params.parent != undefined) {
                addOnFilter.value.parent = params.parent
            }
        })

        const { openCreatePane, queryFilter } = useTopicContext()

        watch(() => [addOnFilter.value.order, addOnFilter.value.direction], ([order, direction]) => queryFilter.value.order = ((direction === "descending" ? "-" : "") + order) as TopicQueryFilter["order"], {immediate: true})
        watch(() => addOnFilter.value.type, type => queryFilter.value.type = type, {immediate: true})
        watch(() => addOnFilter.value.favorite, f => queryFilter.value.favorite = f || undefined, {immediate: true})
        watch(() => addOnFilter.value.parent, parent => queryFilter.value.parentId = parent?.id ?? undefined, {immediate: true})
        watch(() => addOnFilter.value.annotations, annotations => queryFilter.value.annotationIds = annotations?.length ? annotations.map(a => a.id) : undefined, {immediate: true})

        return () => <div class="middle-layout">
            <div class="layout-container"/>
            <div class="layout-container">
                <SearchBox class="w-75 is-stretch-item" value={queryFilter.value.search} onUpdateValue={v => queryFilter.value.search = v}/>
                <AddOnFilter class="ml-1" templates={addOnTemplates} value={addOnFilter.value} onUpdateValue={v => addOnFilter.value = v} onClear={clear}/>
            </div>
            <div class="layout-container">
                <DataRouter/>
                <button class="square button no-drag radius-large is-white" onClick={() => openCreatePane()}>
                    <span class="icon"><i class="fa fa-plus"/></span>
                </button>
            </div>
        </div>
    }
})

interface AddOnFilterType {
    order: string
    direction: "descending" | "ascending"
    type?: TopicType
    favorite?: boolean
    parent?: ParentTopic
    annotations?: SimpleAnnotation[]
}

const addOnFilterDefault: AddOnFilterType = {
    order: "updateTime",
    direction: "descending"
}

const addOnTemplates: AddOnTemplate[] = [
    {
        type: "radio",
        key: "type",
        items: TOPIC_TYPE_ENUMS_WITHOUT_UNKNOWN.map(t => ({title: TOPIC_TYPE_NAMES[t], value: t, icon: TOPIC_TYPE_ICONS[t]})),
        showTitle: true
    },
    {type: "separator"},
    {
        type: "checkbox",
        key: "favorite",
        title: "收藏",
        color: "danger",
        icon: "heart"
    },
    {type: "separator"},
    {
        type: "label",
        key: "parent",
        title: "选择父主题…",
        equals: (a: ParentTopic, b: ParentTopic) => a.id === b.id,
        render: (value: ParentTopic) => <>
            <span class={["icon", value.color ? `has-text-${value.color}` : undefined]}><i class={`fa fa-${TOPIC_TYPE_ICONS[value.type]}`}/></span>
            <span class={value.color ? `has-text-${value.color}` : undefined}>{value.name}</span>
        </>,
        renderForm: (v, setValue, close) => <>
            {!!v && <ClearButton onClick={close}/>}
            <TopicSelector onPick={setValue}/>
        </>
    },
    {
        type: "label",
        key: "annotations",
        title: "选择注解…",
        multi: true,
        equals: (a: SimpleAnnotation, b: SimpleAnnotation) => a.id === b.id,
        render: (value: SimpleAnnotation) => <>
            <b>[</b><span class="mx-1">{value.name}</span><b>]</b>  
        </>,
        renderForm: (v, setValue, close) => <>
            {!!v && <ClearButton onClick={close}/>}
            <AnnotationSelector onPick={setValue}/>
        </>
    },
    {type: "separator"},
    {
        type: "order",
        items: [
            {title: "按名称", value: "name"},
            {title: "按评分", value: "score"},
            {title: "按项目数", value: "count"},
            {title: "按创建顺序", value: "createTime"},
            {title: "按更新顺序", value: "updateTime"},
        ],
        defaultValue: "updateTime",
        defaultDirection: "descending"
    }
]

const ClearButton = defineComponent({
    emits: ["click"],
    setup(_, { emit }) {
        return () => <div class="px-1 pt-1">
            <button class="button is-small is-white w-100" onClick={() => emit("click")}>
                <span class="icon"><i class="fa fa-times"/></span>
                <span>清除选择项</span>
            </button>
        </div>
    }
})

const TopicSelector = defineComponent({
    emits: ["pick"],
    setup(_, { emit }) {
        const request: SearchRequestFunction = (httpClient, offset, limit, search) =>
            httpClient.topic.list({offset, limit, search, order: "-updateTime"})

        const pick = (v: ParentTopic) => emit("pick", v)

        const slots = {
            default: (topic: ParentTopic) => <span class="tag">{topic.name}</span>
        }

        return () => <SearchPicker placeholder="搜索父主题" request={request} onPick={pick} v-slots={slots}/>
    }
})

const AnnotationSelector = defineComponent({
    emits: ["pick"],
    setup(_, { emit }) {
        const request: SearchRequestFunction = (httpClient, offset, limit, search) =>
            httpClient.annotation.list({offset, limit, search, order: "-createTime"})

        const pick = (v: SimpleAnnotation) => emit("pick", v)

        const slots = {
            default: (topic: SimpleAnnotation) => <span class="tag">
                <b>[</b><span class="mx-1">{topic.name}</span><b>]</b>
            </span>
        }

        return () => <SearchPicker placeholder="搜索注解" request={request} onPick={pick} v-slots={slots}/>
    }
})
