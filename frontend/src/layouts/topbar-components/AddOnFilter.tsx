import { computed, defineComponent, PropType, toRef, VNode } from "vue"
import { MenuItem, useElementPopupMenu } from "@/functions/module"
import style from "./AddOnFilter.module.scss"

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
            <FilterButton key="filter-button" templates={props.templates} value={filterValue.value ?? {}} onSetValue={setValue}
                          onClear={clear}/>
        </div>
    }
})

function renderAddOnComponents(templates: AddOnTemplate[], filterValue: {[key: string]: any}, setValue: (key: string, value: any) => void) {
    return templates.map(template => {
        if(template.type === "separator" || template.type === "order") {
            return undefined
        }
        const value = filterValue[template.key]
        if(template.type === "checkbox") {
            if(value) {
                return <CheckBoxItem key={template.key} title={template.title} icon={template.icon} color={template.color} onCancel={() => setValue(template.key, false)}/>
            }
        }else if(template.type === "radio") {
            if(value != undefined) {
                const item = template.items.find(i => i.value === value)
                if(item !== undefined) {
                    return <RadioItem key={template.key} title={item.title} value={item.value} icon={item.icon} color={item.color} items={template.items} showTitle={template.showTitle} onUpdateValue={v => setValue(template.key, v)}/>
                }
            }
        }else if(template.type === "complex") {
            if(value != undefined && (!template.multi || (value as any[]).length)) {
                return <ComplexItem key={template.key} value={value} multi={template.multi} render={template.render}/>
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
    emits: ["cancel"],
    setup(props, { emit }) {
        const cancel = () => emit("cancel")

        const { element, popup } = useElementPopupMenu(() => [{type: "checkbox", label: props.title, checked: true, click: cancel}], {position: "bottom", offsetY: 8})

        return () => <span class={[style.element, style.onlyIcon, props.color ? `has-text-${props.color}` : undefined]} ref={element} onClick={popup}>
            {props.icon
                ? <i class={`fa fa-${props.icon}`}/>
                : <span class={style.text}>props.title</span>}
        </span>
    }
})

const RadioItem = defineComponent({
    props: {
        title: {type: String, required: true},
        value: {type: String, required: true},
        icon: String,
        color: String,
        items: {type: Array as PropType<RadioTemplate["items"]>, required: true},
        showTitle: Boolean
    },
    emits: ["updateValue"],
    setup(props, { emit }) {
        const { element, popup } = useElementPopupMenu(() => props.items.map(item => ({
            type: "checkbox",
            label: item.title,
            checked: props.value === item.value,
            click() {
                if(props.value === item.value) {
                    emit("updateValue", undefined)
                }else{
                    emit("updateValue", item.value)
                }
            }
        })), {position: "bottom", offsetY: 8})

        return () => <span class={{[style.element]: true, [style.onlyIcon]: props.icon && !props.showTitle, [`has-text-${props.color}`]: !!props.color}} ref={element} onClick={popup}>
            {props.icon ? <i class={`fa fa-${props.icon}`}/> : null}
            {props.showTitle || !props.icon ? <span class={style.text}>{props.title}</span> : null}
        </span>
    }
})

const ComplexItem = defineComponent({
    props: {
        value: {type: null as any as PropType<any>, required: true},
        multi: Boolean,
        render: {type: null as any as PropType<ComplexTemplate["render"]>, required: true}
    },
    setup(props) {
        return props.multi
            ? () => <div class={style.grouped}>{(props.value as any[]).map(v => <span class={style.element}>{props.render(v)}</span>)}</div>
            : () => <span class={[style.element]}>{props.render(props.value)}</span>
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
        const { element, popup } = useElementPopupMenu(() => generateMenuByTemplate(props.templates, props.value, setValue, clear), {position: "bottom", offsetY: 8})
        const active = computed(() => calcActive(props.templates, props.value))

        return () => <button ref={element} class={`square button radius-circle is-white ${active.value ? "has-text-link" : ""}`} onClick={popup}>
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
    icon?: string
    color?: string
}

interface RadioTemplate {
    type: "radio"
    key: string
    items: {
        title: string
        value: string
        icon?: string
        color?: string
    }[]
    showTitle?: boolean
}

interface ComplexTemplate {
    type: "complex"
    key: string
    title: string
    multi?: boolean
    render(value: any): VNode[] | VNode | undefined
}

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

function generateMenuByTemplate(templates: AddOnTemplate[], filterValue: {[key: string]: any}, setValue: (key: string, value: any) => void, clear: () => void): MenuItem<undefined>[] {
    return templates.flatMap(t => {
        if(t.type === "separator") {
            return SEPARATOR_TEMPLATE
        }else if(t.type === "order") {
            return generateOrderTemplate(t, filterValue["order"], v => setValue("order", v), filterValue["direction"], v => setValue("direction", v))
        }else if(t.type === "checkbox") {
            return generateCheckBoxTemplate(t, filterValue[t.key], v => setValue(t.key, v))
        }else if(t.type === "radio"){
            return generateRadioTemplate(t, filterValue[t.key], v => setValue(t.key, v))
        }else if(t.type === "complex") {
            return generateComplexTemplate(t)
        }else{
            return []
        }
    }).concat(generateFunctions(clear))
}

const SEPARATOR_TEMPLATE: MenuItem<undefined> = {type: "separator"}

function generateCheckBoxTemplate(template: CheckBoxTemplate, value: boolean, setValue: (v: boolean) => void): MenuItem<undefined>[] {
    return [{
        type: "checkbox",
        label: template.title,
        checked: value,
        click() { setValue(!value) }
    }]
}

function generateRadioTemplate(template: RadioTemplate, value: string, setValue: (v: string | undefined) => void): MenuItem<undefined>[] {
    return template.items.map(item => ({
        type: "checkbox",
        label: item.title,
        checked: value === item.value,
        click() { setValue(value === item.value ? undefined : item.value) }
    }))
}

function generateComplexTemplate(template: ComplexTemplate): MenuItem<undefined>[] {
    return [{
        type: "normal",
        label: template.title,
        click() { }
    }]
}

function generateOrderTemplate(template: OrderTemplate,
                               order: string, setOrder: (v: string) => void,
                               direction: "ascending" | "descending", setDirection: (v: "ascending" | "descending") => void): MenuItem<undefined>[] {
    const orderItems: MenuItem<undefined>[] = template.items.map(item => ({
        type: "radio",
        label: item.title,
        checked: item.value === order,
        click() { setOrder(item.value) }
    }))
    const directionItems: MenuItem<undefined>[] = [
        {type: "radio", label: "升序", checked: direction === "ascending", click() { setDirection("ascending") }},
        {type: "radio", label: "降序", checked: direction === "descending", click() { setDirection("descending") }}
    ]
    return [...orderItems, {type: "separator"}, ...directionItems]
}

function generateFunctions(clear: () => void): MenuItem<undefined>[] {
    return [{type: "separator"}, {type: "normal", label: "恢复默认值", click: clear}]
}
