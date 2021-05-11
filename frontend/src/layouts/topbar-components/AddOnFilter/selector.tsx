import { defineComponent, reactive, VNode, PropType } from "vue"
import { AddOnTemplate, RenderFormFunction } from "./define"
import style from "./style.module.scss"

export const LabelSelector = defineComponent({
    props: {
        show: {type: Boolean, required: true},
        value: null as any as PropType<any>,
        render: null as any as PropType<RenderFormFunction>,
    },
    emits: ["close", "setValue"],
    setup(props, { emit }) {
        const setValue = (v: any) => emit("setValue", v)
        const close = () => emit("close")
        return () => props.show && props.render ? <LabelPicker render={() => props.render?.(props.value, setValue, close)} onClose={close}/> : undefined
    }
})

const LabelPicker = defineComponent({
    props: {
        render: {type: null as any as PropType<() => VNode[] | VNode | undefined>, required: true}
    },
    emits: ["close"],
    setup(props, { emit }) {
        return () => <>
            <div class={style.pickerBackground} onClick={() => emit("close")}/>
            <div class={[style.picker, "is-overflow-hidden", "block", "is-light", "is-white", "has-border-more-deep-light"]}>
                {props.render()}
            </div>
        </>
    }
})

export function needLabelSelector(templates: AddOnTemplate[]) {
    for(const template of templates) {
        if(template.type === "label") {
            return true
        }
    }
    return false
}

export function useLabelSelector() {
    let setValueCallback: SetValueFunction | undefined = undefined

    const openLabelSelector: OpenLabelSelectorFunction = (render, value, setValue) => {
        setValueCallback = setValue
        props.render = render
        props.value = value
        props.show = true
    }

    const onSetValue = (v: any | undefined) => {
        setValueCallback?.(v)
        onClose()
    }

    const onClose = () => {
        props.show = false
        props.value = undefined
        props.render = undefined
        setValueCallback = undefined
    }

    const props = reactive<{
        show: boolean,
        value?: any,
        render?: RenderFormFunction,
        onSetValue: SetValueFunction,
        onClose(): void
    }>({
        show: false,
        onSetValue,
        onClose
    })

    return {props, openLabelSelector}
}

export interface OpenLabelSelectorFunction {
    (render: RenderFormFunction, value: any, setValue: SetValueFunction): void
}

interface SetValueFunction {
    (v: any | undefined): void
}
