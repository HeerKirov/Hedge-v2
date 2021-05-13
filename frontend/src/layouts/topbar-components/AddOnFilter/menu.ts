import { MenuItem } from "@/functions/module"
import { AddOnTemplate, CheckBoxTemplate, ComplexLabelTemplate, OrderTemplate, RadioTemplate } from "./define"
import { OpenLabelSelectorFunction } from "./selector"

export function generateMenuByTemplate(templates: AddOnTemplate[], filterValue: {[key: string]: any}, setValue: (key: string, value: any) => void, clear: () => void, openLabelSelector: OpenLabelSelectorFunction | undefined): MenuItem<undefined>[] {
    return templates.flatMap(t => {
        if(t.type === "separator") {
            return SEPARATOR_TEMPLATE
        }else if(t.type === "order") {
            return generateOrderTemplate(t, filterValue["order"], v => setValue("order", v), filterValue["direction"], v => setValue("direction", v))
        }else if(t.type === "checkbox") {
            return generateCheckBoxTemplate(t, filterValue[t.key], v => setValue(t.key, v))
        }else if(t.type === "radio"){
            return generateRadioTemplate(t, filterValue[t.key], v => setValue(t.key, v))
        }else if(t.type === "label") {
            return generateComplexTemplate(t, filterValue[t.key], v => setValue(t.key, v), openLabelSelector)
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

function generateComplexTemplate(template: ComplexLabelTemplate, value: any, setValue: (v: any) => void, openLabelSelector: OpenLabelSelectorFunction | undefined): MenuItem<undefined>[] {
    //multi模式下从菜单访问的selector总是以add模式渲染，not multi模式可能以edit模式渲染
    const renderValue = template.multi ? undefined : value
    //multi模式下追加新value，not multi模式使用传入的setValue替换现有的value
    const setValueCallback = template.multi 
        ? (v: any | undefined) => {
            if(v != undefined) {
                const oldValue = <any[] | undefined>value
                if(oldValue != undefined) {
                    //存在旧值时，将其追加到列表末尾
                    if(!oldValue.some(n => template.equals(n, v))) {
                        //去重: 确认没有重复项时，确定执行追加
                        setValue([...oldValue, v])
                    }
                }else{
                    //不存在旧值时，构造新的列表
                    setValue([v])
                }
            }
        } 
        : setValue

    return [{
        type: "normal",
        label: template.title,
        click() {
            openLabelSelector?.(template.renderForm, renderValue, setValueCallback)
        }
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
