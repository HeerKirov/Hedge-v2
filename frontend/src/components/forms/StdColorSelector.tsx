import { computed, defineComponent, PropType, ref } from "vue"
import { watchElementExcludeClick } from "@/functions/utils/element"
import style from "./StdColorSelector.module.scss"

export const colorEnum = [
    "red", "orange", "yellow",
    "pink", "deeppink", "purple",
    "blue", "skyblue", "bluepurple",
    "cyan", "lightgreen", "green",
    "teal", "tea", "brown"
] as const

const colors: StdColor[] = colorEnum as any as StdColor[]

export type StdColor = typeof colorEnum[number]

export default defineComponent({
    props: {
        value: String,
        theme: {type: String as PropType<"rectangle" | "element">, default: "rectangle"}
    },
    emits: {
        updateValue(_: StdColor) { return true }
    },
    setup(props, { emit }) {
        const rootRef = ref<HTMLElement>()
        const showPicker = ref(false)

        watchElementExcludeClick(rootRef, () => showPicker.value = false)

        const pick = (color: StdColor) => {
            showPicker.value = false
            emit("updateValue", color)
        }

        const themeClass = computed(() => ({
            rectangle: style.rectangle,
            element: style.element
        }[props.theme]))

        return () => <div ref={rootRef} class={[style.colorSelector, themeClass.value]}>
            <div class={[style.colorBlock, `has-bg-${props.value}`]} onClick={() => showPicker.value = !showPicker.value}/>
            {showPicker.value && <ColorPicker onPick={pick}/>}
        </div>
    }
})

const ColorPicker = defineComponent({
    emits: ["pick"],
    setup(_ ,{ emit }) {
        const elements = <div class={style.colorPicker}>
            {colors.map(col => <div class={[style.block, `has-bg-${col}`]} onClick={() => emit("pick", col)}/>)}
        </div>

        return () => elements
    }
})
