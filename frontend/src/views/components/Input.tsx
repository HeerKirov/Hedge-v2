import { defineComponent, ref, toRef, watch } from "vue"

export default defineComponent({
    props: {
        value: String,
        type: {
            type: String,
            default: 'text'
        },
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

        return () => props.refreshOnInput
            ? <input class="input" type={type.value} value={value.value} onInput={onUpdate}/>
            : <input class="input" type={type.value} value={value.value} onChange={onUpdate}/>
    }
})