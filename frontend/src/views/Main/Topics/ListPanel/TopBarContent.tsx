import { defineComponent, ref, watch } from "vue"
import { DataRouter, SearchBox, AddOnFilter, AddOnTemplate } from "@/layouts/topbar-components"
import { ParentTopic, TopicQueryFilter, TopicType } from "@/functions/adapter-http/impl/topic"
import { watchNavigatorEvent } from "@/functions/navigator"
import { TOPIC_TYPE_ENUMS_WITHOUT_UNKNOWN, TOPIC_TYPE_ICONS, TOPIC_TYPE_NAMES } from "../define"
import { useTopicContext } from "../inject"
import { SimpleAnnotation } from "@/functions/adapter-http/impl/annotations";

export default defineComponent({
    setup() {
        const addOnValue = ref<{
            order: string,
            direction: "descending" | "ascending",
            type: TopicType | undefined,
            favorite: boolean,
            //TODO 这两个复杂参数的属性该如何处理？
            parentId: number | undefined,
            annotationIds: number[] | undefined
        }>({
            order: "updateTime",
            direction: "descending",
            type: undefined,
            favorite: false,
            parentId: undefined,
            annotationIds: undefined
        })

        watchNavigatorEvent("MainTopics", (params: {parentId?: number}) => {
            if(params.parentId != undefined) {
                addOnValue.value.parentId = params.parentId
            }
        })

        const { openCreatePane, queryFilter } = useTopicContext()

        watch(() => [addOnValue.value.order, addOnValue.value.direction], ([order, direction]) => queryFilter.value.order = ((direction === "descending" ? "-" : "") + order) as TopicQueryFilter["order"], {immediate: true})
        watch(() => addOnValue.value.type, type => queryFilter.value.type = type, {immediate: true})
        watch(() => addOnValue.value.favorite, f => queryFilter.value.favorite = f || undefined, {immediate: true})

        return () => <div class="middle-layout">
            <div class="layout-container"/>
            <div class="layout-container is-shrink-item">
                <SearchBox class="w-75" value={queryFilter.value.search} onUpdateValue={v => queryFilter.value.search = v}/>
                <AddOnFilter class="ml-1" templates={addOnTemplates} value={addOnValue.value} onUpdateValue={v => addOnValue.value = v}/>
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
        type: "complex",
        key: "parent",
        title: "选择父主题…",
        render: (value: ParentTopic) => <span class={`tag is-light is-${value.color}`}>
            <span class="icon"><i class={`fa fa-${TOPIC_TYPE_ICONS[value.type]}`}/></span>
            {value.name}
        </span>
    },
    {
        type: "complex",
        key: "annotations",
        title: "选择注解…",
        multi: true,
        render: (value: SimpleAnnotation) => <span class="tag">
            <b>[</b><span class="mx-1">{value.name}</span><b>]</b>
        </span>
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
