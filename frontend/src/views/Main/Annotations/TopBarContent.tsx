import { defineComponent, ref, watch } from "vue"
import { DataRouter, AddOnFilter, SearchBox, AddOnTemplate } from "@/layouts/topbars"
import { AnnotationQueryFilter, AnnotationTarget } from "@/functions/adapter-http/impl/annotations"
import { TARGET_TYPE_ENUMS, TARGET_TYPE_NAMES, TARGET_TYPE_ICONS } from "@/definitions/annotation"
import { useAnnotationContext } from "./inject"

export default defineComponent({
    setup() {
        const addOnFilter = ref<AddOnFilterType>({...addOnFilterDefault})

        const clear = () => addOnFilter.value = {...addOnFilterDefault}

        const { openCreatePane, queryFilter } = useAnnotationContext()

        watch(() => [addOnFilter.value.order, addOnFilter.value.direction], ([order, direction]) => queryFilter.value.order = ((direction === "descending" ? "-" : "") + order) as AnnotationQueryFilter["order"], {immediate: true})
        watch(() => addOnFilter.value.target, t => queryFilter.value.target = t, {immediate: true})
        watch(() => addOnFilter.value.canBeExported, t => queryFilter.value.canBeExported = t, {immediate: true})

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
    target?: AnnotationTarget
    canBeExported?: boolean
}

const addOnFilterDefault: AddOnFilterType = {
    order: "createTime",
    direction: "descending"
}

const addOnTemplates: AddOnTemplate[] = [
    {
        type: "radio",
        key: "target",
        items: TARGET_TYPE_ENUMS.map(t => ({title: TARGET_TYPE_NAMES[t], value: t, icon: TARGET_TYPE_ICONS[t]})),
        showTitle: true
    },
    {type: "separator"},
    {
        type: "radio",
        key: "canBeExported",
        items: [
            {title: "可导出", value: "true", icon: "share-square"},
            {title: "不可导出", value: "false", icon: "share-alt-square"}
        ],
        showTitle: true
    },
    {type: "separator"},
    {
        type: "order",
        items: [
            {title: "按名称", value: "name"},
            {title: "按创建顺序", value: "createTime"}
        ],
        defaultValue: "createTime",
        defaultDirection: "descending"
    }
]
