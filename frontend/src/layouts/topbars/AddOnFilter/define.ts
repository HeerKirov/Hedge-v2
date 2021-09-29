import { VNode } from "vue"

export type AddOnTemplate = Separator | OrderTemplate | CheckBoxTemplate | RadioTemplate | ComplexLabelTemplate

export interface Separator {
    type: "separator"
}

export interface OrderTemplate {
    type: "order"
    items: {title: string, value: string}[]
    defaultValue: string
    defaultDirection: "ascending" | "descending"
}

export interface CheckBoxTemplate {
    type: "checkbox"
    key: string
    title: string
    icon?: string
    color?: string
}

export interface RadioTemplate {
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

export interface ComplexLabelTemplate {
    type: "label"
    key: string
    title: string
    multi?: boolean
    equals: EqualFunction
    render: RenderFunction
    renderForm: RenderFormFunction
}
export type EqualFunction = (a: any, b: any) => boolean
export type RenderFunction = (value: any) => VNode[] | VNode | undefined
export type RenderFormFunction = (value: any, setValue: (v: any | undefined) => void, close: () => void) => VNode[] | VNode | undefined
