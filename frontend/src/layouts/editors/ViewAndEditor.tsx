import { defineComponent, PropType, ref } from "vue"
import { watchGlobalKeyEvent } from "@/services/global/keyboard"
import { useMouseHover } from "@/functions/utils/element"
import { objects } from "@/utils/primitives"
import style from "./ViewAndEditor.module.scss"

/**
 * 通用组件：在侧边栏中，提供单个属性项的view、editor切换、edit处理全套功能。
 * - 通过data属性向下透传数据项。此数据项还会被复制一份用作edit模式。
 * - 内置edit切换按钮和保存按钮。
 * - 向上透传setData事件，并根据返回值确定是否处理成功。
 */
export default defineComponent({
    props: {
        /**
         * 数据的值。
         */
        data: {type: null as any as PropType<any>, required: true},
        /**
         * 在编辑模式下，使用与显示模式不同的另一个数据构建。同时，编辑器的回调数据也以编辑模式数据为准。
         */
        useEditorData: Boolean,
        /**
         * 在编辑模式数据。
         */
        editorData: null as any as PropType<any>,
        /**
         * 在editor保存时，调用此回调执行保存。此回调的返回值告知保存是否成功。
         */
        onSetData: {type: null as any as PropType<SetDataFunction>, required: true},
        /**
         * 显示[编辑]按钮。默认应该显示，除非要自己做。
         */
        showEditButton: {type: Boolean, default: true},
        /**
         * 在编辑模式下显示[保存]按钮。默认应该显示，除非要自己做。
         */
        showSaveButton: {type: Boolean, default: true},
        /**
         * 编辑按钮在文档排布中的基线位置。
         */
        baseline: {type: String as any as PropType<"std" | "medium">, default: "std"},
        /**
         * 编辑按钮的颜色。
         */
        color: {type: String, default: "white"}
    },
    setup(props, { slots }) {
        const editMode = ref(false)
        const edit = () => {
            editMode.value = true
            editorValue.value = objects.deepCopy(props.useEditorData ? props.editorData : props.data)
        }
        const save = async () => {
            const f = props.onSetData
            if(await f(editorValue.value)) {
                editMode.value = false
            }
        }

        const { hover, ...hoverEvents } = useMouseHover()

        const editorValue = ref()
        const setEditorValue = (newValue: any) => { editorValue.value = newValue }

        watchGlobalKeyEvent(e => {
            if(editMode.value && e.key === "Enter" && e.metaKey) {
                save().finally()
                e.preventDefault()
                e.stopPropagation()
            }
        })

        return () => editMode.value ? <div class={style.root}>
            {props.showSaveButton && <button class={["square", "button", "is-small", `is-${props.color}`, "has-text-link", "float-right", style.button, baselineStyle[props.baseline]]} onClick={save}><span class="icon"><i class="fa fa-save"/></span></button>}
            {slots.editor?.({value: editorValue.value, setValue: setEditorValue, save})}
        </div> : props.showEditButton ? <div class={style.root} {...hoverEvents}>
            {hover.value && <button class={["square", "button", "is-small", `is-${props.color}`, "has-text-link", "float-right", style.button, baselineStyle[props.baseline]]} onClick={edit}><span class="icon"><i class="fa fa-edit"/></span></button>}
            {slots.default?.({value: props.data, edit})}
        </div> : <div class={style.root}>
            {slots.default?.({value: props.data, edit})}
        </div>
    }
})

export interface VAEDisplay<T> {
    value: T
    edit(): void
}

export interface VAEEditor<T> {
    value: T
    setValue(v: T): void
    save(): void
}

interface SetDataFunction {
    (data: any): Promise<boolean>
}

const baselineStyle = {
    "std": style.baselineStd,
    "medium": style.baselineMedium
}
