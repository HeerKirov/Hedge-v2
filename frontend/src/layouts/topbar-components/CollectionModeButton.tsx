import { defineComponent } from "vue"
import style from "./CollectionModeButton.module.scss"

export default defineComponent({
    props: {
        value: Boolean
    },
    emits: ["updateValue"],
    setup(props, { emit }) {
        const click = () => emit("updateValue", !props.value)

        return () => <button class={["no-drag", "button", "is-white", "square", "radius-circle", style.button]} onClick={click}>
            <i class={`fa fa-${props.value ? "images" : "file-image"}`}/>
        </button>
    }
})
