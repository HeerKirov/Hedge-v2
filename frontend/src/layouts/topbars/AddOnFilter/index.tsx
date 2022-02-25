import { computed, defineComponent, PropType, toRef } from "vue"
import { useElementPopupMenu } from "@/services/module/popup-menu"
import { AddOnTemplate } from "./define"
import { generateMenuByTemplate } from "./menu"
import { renderAddOnComponents } from "./components"
import { LabelSelector, needLabelSelector, useLabelSelector } from "./selector"
import style from "./style.module.scss"

export type { AddOnTemplate }

export default defineComponent({
    props: {
        templates: {type: Array as PropType<AddOnTemplate[]>, default: []},
        value: Object as PropType<{[key: string]: any}>
    },
    emits: ["updateValue", "clear"],
    setup(props, { emit }) {
        const filterValue = toRef(props, "value")

        const setValue = (key: string, value: any) => emit("updateValue", {...filterValue.value, [key]: value})

        const clear = () => emit("clear")

        return () => <div class={["no-drag", style.root]}>
            {renderAddOnComponents(props.templates, filterValue.value ?? {}, setValue)}
            <FilterButton key="filter-button" templates={props.templates} 
                          value={filterValue.value ?? {}} onSetValue={setValue}
                          onClear={clear}/>
        </div>
    }
})

const FilterButton = defineComponent({
    props: {
        templates: {type: Array as PropType<AddOnTemplate[]>, required: true},
        value: {type: Object as PropType<{[key: string]: any}>, required: true}
    },
    emits: ["setValue", "clear"],
    setup(props, { emit }) {
        const setValue = (key: string, value: any) => emit("setValue", key, value)
        const clear = () => emit("clear")

        function calcActive(templates: AddOnTemplate[], value: {[key: string]: any}) {
            for (const template of templates) {
                if(template.type === "order") {
                    if(value["order"] !== template.defaultValue || value["direction"] !== template.defaultDirection) return true
                }else if(template.type === "checkbox") {
                    if(value[template.key]) return true
                }else if(template.type !== "separator") {
                    if(value[template.key] != undefined) return true
                }
            }
            return false
        }

        const labelSelector = needLabelSelector(props.templates) ? useLabelSelector() : null

        const { element, popup } = useElementPopupMenu(() => generateMenuByTemplate(props.templates, props.value, setValue, clear, labelSelector?.openLabelSelector), {position: "bottom", offsetY: 8})
        const active = computed(() => calcActive(props.templates, props.value))

        return labelSelector
            ? () => <div class={style.filterButton}>
                <button ref={element} class={["square", "button", "radius-circle", "is-white", active.value ? "has-text-link" : undefined]} onClick={popup}>
                    <span class="icon"><i class="fa fa-filter"/></span>
                </button>
                <LabelSelector {...labelSelector.props}/>
            </div>
            : () => <button ref={element} class={["square", "button", "radius-circle", "is-white", active.value ? "has-text-link" : undefined]} onClick={popup}>
                <span class="icon"><i class="fa fa-filter"/></span>
            </button>
    }
})

