import { defineComponent } from "vue"
import { useElementPopupMenu } from "@/functions/module/popup-menu"
import { arrays } from "@/utils/collections"
import style from "./ColumnNumButton.module.scss"

export default defineComponent({
    props: {
        value: {type: Number, required: true}
    },
    emits: ["updateValue"],
    setup(props, { emit }) {
        const MAX = 16, MIN = 3
        const menu = useElementPopupMenu(() => arrays.newArray(MAX - MIN + 1, i => ({
            type: "radio",
            label: `${i + MIN} 列`,
            checked: props.value === i + MIN,
            click() {
                emit("updateValue", i + MIN)
            }
        })), {position: "bottom", offsetY: 4})

        return () => <button ref={menu.element} class={[style.root, "button", "is-white"]} onClick={() => menu.popup()}>
            <i class="fa fa-columns"/>{props.value}
        </button>
    }
})
