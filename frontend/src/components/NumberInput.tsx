import { defineComponent, Ref, ref, watch } from "vue"

export default defineComponent({
    props: {
        value: Number,
        placeholder: String,
        max: Number,
        min: Number,
        refreshOnInput: {
            type: Boolean,
            default: false
        }
    },
    emits: ['updateValue'],
    setup(props, { emit }) {
        const value: Ref<number | undefined> = ref(props.value)

        watch(() => props.value, () => { value.value = props.value })

        const onUpdate = (e: InputEvent) => {
            value.value = parseInt((e.target as HTMLInputElement).value)
            emit('updateValue', value.value)
        }

        return () => {
            const events = {[props.refreshOnInput ? "onInput" : "onChange"]: onUpdate}
            return <input class="input" type="number" max={props.max} min={props.min} value={value.value} {...events} placeholder={props.placeholder}/>
        }
    }
})