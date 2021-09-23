import { defineComponent, PropType, ref } from "vue"
import { watchGlobalKeyEvent } from "@/functions/feature/keyboard"
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
        data: {type: null as any as PropType<any>, required: true},
        onSetData: {type: null as any as PropType<SetDataFunction>, required: true},
        showEditButton: {type: Boolean, default: true},
        showSaveButton: {type: Boolean, default: true},
        baseline: {type: String as any as PropType<"std" | "medium">, default: "std"},
        color: {type: String, default: "white"}
    },
    setup(props, { slots }) {
        const editMode = ref(false)
        const edit = () => {
            editMode.value = true
            editorValue.value = objects.deepCopy(props.data)
        }
        const save = async () => {
            const f = props.onSetData
            if(await f(editorValue.value)) {
                editMode.value = false
            }
        }

        const { hover, mouseover, mouseleave } = useMouseHover()

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
        </div> : props.showEditButton ? <div class={style.root} onMouseover={mouseover} onMouseleave={mouseleave}>
            {hover.value && <button class={["square", "button", "is-small", `is-${props.color}`, "has-text-link", "float-right", style.button, baselineStyle[props.baseline]]} onClick={edit}><span class="icon"><i class="fa fa-edit"/></span></button>}
            {slots.default?.({value: props.data, edit})}
        </div> : <div class={style.root}>
            {slots.default?.({value: props.data, edit})}
        </div>
    }
})

interface SetDataFunction {
    (data: any): Promise<boolean>
}

const baselineStyle = {
    "std": style.baselineStd,
    "medium": style.baselineMedium
}
