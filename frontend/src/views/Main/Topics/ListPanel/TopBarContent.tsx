import { defineComponent, ref, watch } from "vue"
import { DataRouter, SearchBox, AddOnFilter, AddOnTemplate } from "@/layouts/topbar-components"
import { watchNavigatorEvent } from "@/functions/navigator"
import { TOPIC_TYPE_ENUMS_WITHOUT_UNKNOWN, TOPIC_TYPE_ICONS, TOPIC_TYPE_NAMES } from "../define"
import { useTopicContext } from "../inject"

export default defineComponent({
    setup() {
        watchNavigatorEvent("MainTopics", (params: {parentId?: number}) => {
            console.log(params)
        })

        const { openCreatePane, queryFilter } = useTopicContext()

        const addOnValue = ref({
            order: "updateTime",
            direction: "descending",
            type: undefined,
            favorite: false,
            parentId: null,
            annotationIds: null
        })

        watch(addOnValue, v => {
            queryFilter.value.order = ((v.direction === "descending" ? "-" : "") + v.order) as typeof queryFilter.value.order
            queryFilter.value.type = v.type
            queryFilter.value.favorite = v.favorite || undefined
        }, {deep: true})

        //TODO 下一步：
        //      把navigator参数也加入其中
        //      整合整套为一个VCA
        //      处理order的默认参数问题

        return () => <div class="middle-layout">
            <div class="layout-container"/>
            <div class="layout-container is-shrink-item">
                <SearchBox class="w-75" value={queryFilter.value.search} onUpdateValue={v => queryFilter.value.search = v}/>
                <AddOnFilter class="ml-1" templates={addOnTemplates} filter={addOnValue.value} onUpdate={v => addOnValue.value = v}/>
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
        items: TOPIC_TYPE_ENUMS_WITHOUT_UNKNOWN.map(t => ({title: TOPIC_TYPE_NAMES[t], value: t, addOnIcon: TOPIC_TYPE_ICONS[t]})),
    },
    {type: "separator"},
    {
        type: "checkbox",
        key: "favorite",
        title: "收藏",
        addOnColor: "danger",
        addOnIcon: "heart"
    },
    {type: "separator"},
    {
        type: "complex",
        key: "parent",
        title: "选择父主题…",
        render: value => undefined
    },
    {
        type: "complex",
        key: "annotations",
        title: "选择注解…",
        multi: true,
        render: value => undefined
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
