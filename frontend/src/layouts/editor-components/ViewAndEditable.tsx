import { defineComponent, PropType } from "vue"
import { useMouseHover } from "@/functions/utils/element"
import style from "./ViewAndEditor.module.scss"

/**
 * 通用组件：在侧边栏中，提供单个属性项的view，并提供与editor组件类似的浮动编辑按钮。
 */
export default defineComponent({
    props: {
        baseline: {type: String as any as PropType<"std" | "medium">, default: "std"},
        color: {type: String, default: "white"}
    },
    emits: ["edit"],
    setup(props, { emit, slots }) {
        const edit = () => emit("edit")

        const { hover, mouseover, mouseleave } = useMouseHover()

        return () => <div class={style.root} onMouseover={mouseover} onMouseleave={mouseleave}>
            {hover.value && <button class={["square", "button", "is-small", `is-${props.color}`, "has-text-link", "float-right", style.button, baselineStyle[props.baseline]]} onClick={edit}><span class="icon"><i class="fa fa-feather-alt"/></span></button>}
            {slots.default?.()}
        </div>
    }
})

const baselineStyle = {
    "std": style.baselineStd,
    "medium": style.baselineMedium
}
