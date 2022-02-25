import { defineComponent, PropType } from "vue"
import { useElementPopupMenu } from "@/services/module/popup-menu"
import { AddOnTemplate, ComplexLabelTemplate, RadioTemplate } from "./define"
import { LabelSelector, useLabelSelector } from "./selector"
import style from "./style.module.scss"

export function renderAddOnComponents(templates: AddOnTemplate[], filterValue: {[key: string]: any}, setValue: (key: string, value: any) => void) {
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
        }else if(template.type === "label") {
            if(value != undefined && (!template.multi || (value as any[]).length)) {
                return <ComplexLabelItem key={template.key}
                                         value={value}
                                         multi={template.multi}
                                         render={template.render}
                                         renderForm={template.renderForm}
                                         equals={template.equals}
                                         onUpdateValue={v => setValue(template.key, v)}/>
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

        return () => <span class={[style.element, style.clickable, style.onlyIcon, props.color ? `has-text-${props.color}` : undefined]} ref={element} onClick={popup}>
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

        return () => <span class={{[style.element]: true, [style.clickable]: true, [style.onlyIcon]: props.icon && !props.showTitle, [`has-text-${props.color}`]: !!props.color}} ref={element} onClick={popup}>
            {props.icon ? <i class={`fa fa-${props.icon}`}/> : null}
            {props.showTitle || !props.icon ? <span class={style.text}>{props.title}</span> : null}
        </span>
    }
})

const ComplexLabelItem = defineComponent({
    props: {
        value: {type: null as any as PropType<any>, required: true},
        multi: Boolean,
        render: {type: null as any as PropType<ComplexLabelTemplate["render"]>, required: true},
        renderForm: {type: null as any as PropType<ComplexLabelTemplate["renderForm"]>, required: true},
        equals: {type: null as any as PropType<ComplexLabelTemplate["equals"]>, required: true}
    },
    emits: ["updateValue"],
    setup(props, { emit }) {
        if(props.multi) {
            const onUpdateValue = (index: number) => (v: any) => {
                //在组件中，value不可能是空数组
                const value = props.value as any[]
                if(v == undefined || !props.equals(value[index], v)) {
                    //首先确认newValue与oldValue不相等。如果相等说明实际上没有任何变化，不必提交更改
                    if(v != undefined && !value.some(n => props.equals(n, v))) {
                        //去重: 确认没有重复项时，执行追加
                        emit("updateValue", [...value.slice(0, index), v, ...value.slice(index + 1)])
                    }else{
                        //否则只是移除旧的项。因为已经确认过旧的项!=新的项了，所以不会产生移除的旧项就是重复项的例外情况
                        if(value.length > 1) {
                            emit("updateValue", [...value.slice(0, index), ...value.slice(index + 1)])
                        }else{
                            //清空最后一个值时，将value设置为undefined以消除整个值
                            emit("updateValue", undefined)
                        }
                    }
                }
            }
            return () => <div class={style.grouped}>
                {(props.value as any[]).map((v, i) => <ComplexLabelItemSingleLabel value={v} render={props.render} renderForm={props.renderForm} onUpdateValue={onUpdateValue(i)}/>)}
            </div>
        }else{
            const updateValue = (v: any) => emit("updateValue", v)
            return () => <ComplexLabelItemSingleLabel value={props.value} render={props.render} renderForm={props.renderForm} onUpdateValue={updateValue}/>
        }
    }
})

const ComplexLabelItemSingleLabel = defineComponent({
    props: {
        value: {type: null as any as PropType<any>, required: true},
        render: {type: null as any as PropType<ComplexLabelTemplate["render"]>, required: true},
        renderForm: {type: null as any as PropType<ComplexLabelTemplate["renderForm"]>, required: true},
    },
    emits: ["updateValue"],
    setup(props, { emit }) {
        const labelSelector = useLabelSelector()

        const setValue = (v: any | undefined) => emit("updateValue", v)

        const open = () => labelSelector.openLabelSelector(props.renderForm, props.value, setValue)

        return () => <span class={[style.element, "is-size-small"]}>
            <ComplexLabelItemRenderContent value={props.value} render={props.render} onClick={open}/>
            <LabelSelector {...labelSelector.props}/>
        </span>
    }
})

const ComplexLabelItemRenderContent = defineComponent({
    props: {
        value: {type: null as any as PropType<any>, required: true},
        render: {type: null as any as PropType<ComplexLabelTemplate["render"]>, required: true}
    },
    setup(props) {
        return () => <span class={style.clickable}>
            {props.render(props.value)}
        </span>
    }
})
