import { defineComponent, ref, toRef, watch } from "vue"

export default defineComponent({
    props: {
        value: String,
        type: {
            type: String,
            default: 'text'
        },
        placeholder: String,
        refreshOnInput: {
            type: Boolean,
            default: false
        }
    },
    emits: ['updateValue'],
    setup(props, { emit }) {
        const type = toRef(props, 'type')
        const value = ref(props.value)

        watch(() => props.value, () => { value.value = props.value })

        const onUpdate = (e: InputEvent) => {
            value.value = (e.target as HTMLInputElement).value
            emit('updateValue', value.value)
        }

        return () => {
            const events = {[props.refreshOnInput ? "onInput" : "onChange"]: onUpdate}
            return <input class="input" type={type.value} value={value.value} {...events} placeholder={props.placeholder}/>
        }
    }
})