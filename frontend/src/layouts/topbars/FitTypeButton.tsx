import { defineComponent, PropType } from "vue"

export default defineComponent({
    props: {
        value: {type: String as PropType<"cover" | "contain">, default: "cover"}
    },
    emits: ["updateValue"],
    setup(props, { emit }) {
        const click = () => emit("updateValue", props.value === "cover" ? "contain" : "cover")

        return () => <button class="button is-white square" onClick={click}>
            <i class={`fa fa-${props.value === "cover" ? "compress" : "compress-arrows-alt"}`}/>
        </button>
    }
})
