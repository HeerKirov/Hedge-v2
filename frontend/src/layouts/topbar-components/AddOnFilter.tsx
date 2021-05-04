import { computed, defineComponent, PropType, reactive, Ref, toRef, VNode, watch } from "vue"
import { MenuItem, useElementPopupMenu } from "@/functions/module"

export default defineComponent({
    props: {
        templates: {type: Array as PropType<AddOnTemplate[]>, default: []},
        filter: Object as PropType<{[key: string]: any}>
    },
    emits: ["update"],
    setup(props, { emit, slots }) {
        const defaultFilterValue = computed<{[key: string]: any}>(() => {
            const orderTemplate = props.templates.find(t => t.type === "order") as OrderTemplate | undefined
            return {
                order: orderTemplate?.defaultValue,
                direction: orderTemplate?.defaultDirection
            }
        })

        const filterValue = reactive({...defaultFilterValue.value})

        watch(() => filterValue, v => emit("update", v), {deep: true})

        const menuItems: Ref<MenuItem<undefined>[]> = computed(() => generateMenuByTemplate(props.templates, filterValue))

        const active = computed(() => calcActive(props.templates, filterValue))

        return () => <div class="flex is-align-center no-drag gap-1">
            <FilterButton active={active.value} menu={menuItems.value}/>
            {renderAddOnComponents(props.templates, filterValue)}
        </div>
    }
})

function renderAddOnComponents(templates: AddOnTemplate[], filterValue: {[key: string]: any}) {
    return templates.map(template => {
        if(template.type === "separator" || template.type === "order") {
            return undefined
        }
        const value = filterValue[template.key]
        if(template.type === "checkbox") {
            if(value) {
                return <CheckBoxItem title={template.title} icon={template.addOnIcon} color={template.addOnColor}/>
            }
        }else if(template.type === "radio") {
            if(value != undefined) {
                const item = template.items.find(i => i.value === value)
                if(item !== undefined) {
                    return <RadioItem title={item.title} icon={item.addOnIcon} color={item.addOnColor}/>
                }
            }
        }
        return undefined
    })
}

const CheckBoxItem = defineComponent({
    props: {
        title: {type: String, required: true},
        icon: String,
        color: String
    },
    setup(props) {
        return () => <span class="tag">
            {props.icon
                ? <span class="icon"><i class={`fa fa-${props.icon} ${props.color ? `has-text-${props.color}` : ""}`}/></span>
                : <span class={props.color ? `has-text-${props.color}` : ""}>{props.title}</span>}
        </span>
    }
})

const RadioItem = defineComponent({
    props: {
        title: {type: String, required: true},
        icon: String,
        color: String
    },
    setup(props) {
        return () => <span class="tag">
            {props.icon
                ? <span class="icon"><i class={`fa fa-${props.icon} ${props.color ? `has-text-${props.color}` : ""}`}/></span>
                : <span class={props.color ? `has-text-${props.color}` : ""}>{props.title}</span>}
        </span>
    }
})

const ComplexItem = defineComponent({
    setup() {

    }
})

const FilterButton = defineComponent({
    props: {
        active: Boolean,
        menu: {type: Array as PropType<MenuItem<undefined>[]>, default: []}
    },
    setup(props) {
        const { element, popup } = useElementPopupMenu(toRef(props, "menu"), {position: "bottom", offsetY: 8})

        return () => <button ref={element} class={`square button radius-circle is-white ${props.active ? "has-text-link" : ""}`} onClick={popup}>
            <span class="icon"><i class="fa fa-filter"/></span>
        </button>
    }
})

export type AddOnTemplate = Separator | OrderTemplate | CheckBoxTemplate | RadioTemplate | ComplexTemplate

interface Separator {
    type: "separator"
}

interface OrderTemplate {
    type: "order"
    items: {title: string, value: string}[]
    defaultValue: string
    defaultDirection: "ascending" | "descending"
}

interface CheckBoxTemplate {
    type: "checkbox"
    key: string
    title: string
    addOnIcon?: string
    addOnColor?: string
}

interface RadioTemplate {
    type: "radio"
    key: string
    items: {
        title: string
        value: string
        addOnIcon?: string
        addOnColor?: string
    }[]
}

interface ComplexTemplate {
    type: "complex"
    key: string
    title: string
    multi?: boolean
    render(value: any): VNode[] | VNode | undefined
}

function calcActive(templates: AddOnTemplate[], filterValue: {[key: string]: any}) {
    for (const template of templates) {
        if(template.type === "order") {
            if(filterValue["order"] !== template.defaultValue || filterValue["direction"] !== template.defaultDirection) return true
        }else if(template.type === "checkbox") {
            if(filterValue[template.key]) return true
        }else if(template.type !== "separator") {
            if(filterValue[template.key] != undefined) return true
        }
    }
    return false
}

function generateMenuByTemplate(templates: AddOnTemplate[], filterValue: {[key: string]: any}): MenuItem<undefined>[] {
    return templates.flatMap(t => {
        if(t.type === "separator") {
            return SEPARATOR_TEMPLATE
        }else if(t.type === "order") {
            return generateOrderTemplate(t, filterValue)
        }else if(t.type === "checkbox") {
            return generateCheckBoxTemplate(t, filterValue)
        }else if(t.type === "radio"){
            return generateRadioTemplate(t, filterValue)
        }else if(t.type === "complex") {
            return generateComplexTemplate(t)
        }else{
            return []
        }
    }).concat(generateFunctions(templates, filterValue))
}

const SEPARATOR_TEMPLATE: MenuItem<undefined> = {type: "separator"}

function generateCheckBoxTemplate(template: CheckBoxTemplate, filterValue: {[key: string]: any}): MenuItem<undefined>[] {
    const checked = !!filterValue[template.key]
    return [{
        type: "checkbox",
        label: template.title,
        checked,
        click() { filterValue[template.key] = !checked }
    }]
}

function generateRadioTemplate(template: RadioTemplate, filterValue: {[key: string]: any}): MenuItem<undefined>[] {
    return template.items.map(item => ({
        type: "checkbox",
        label: item.title,
        checked: filterValue[template.key] === item.value,
        click() {
            if(filterValue[template.key] === item.value) {
                filterValue[template.key] = undefined
            }else{
                filterValue[template.key] = item.value
            }
        }
    }))
}

function generateComplexTemplate(template: ComplexTemplate): MenuItem<undefined>[] {
    return [{
        type: "normal",
        label: template.title,
        click() { }
    }]
}

function generateOrderTemplate(template: OrderTemplate, filterValue: {[key: string]: any}): MenuItem<undefined>[] {
    const orderItems: MenuItem<undefined>[] = template.items.map(item => ({
        type: "radio",
        label: item.title,
        checked: item.value === filterValue["order"],
        click() { filterValue["order"] = item.value }
    }))
    const directionItems: MenuItem<undefined>[] = [
        {type: "radio", label: "升序", checked: filterValue["direction"] === "ascending", click() {  filterValue["direction"] = "ascending" }},
        {type: "radio", label: "降序", checked: filterValue["direction"] === "descending", click() {  filterValue["direction"] = "descending" }}
    ]
    return [...orderItems, {type: "separator"}, ...directionItems]
}

function generateFunctions(templates: AddOnTemplate[], filterValue: {[key: string]: any}): MenuItem<undefined>[] {
    const clear = () => {
        for (const template of templates) {
            if(template.type === "order") {
                filterValue["order"] = template.defaultValue
                filterValue["direction"] = template.defaultDirection
            }else if(template.type !== "separator") {
                filterValue[template.key] = undefined
            }
        }
    }
    return [{type: "separator"}, {type: "normal", label: "恢复默认值", click: clear}]
}
