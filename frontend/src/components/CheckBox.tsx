import { defineComponent, ref, watch } from "vue"

export default defineComponent({
    props: {
        value: Boolean
    },
    emits: ['updateValue'],
    setup(props, { emit, slots }) {
        const value = ref(props.value ?? false)

        watch(() => props.value, () => { value.value = props.value ?? false })

        const onUpdate = (e: Event) => {
            value.value = (e.target as HTMLInputElement).checked
            emit('updateValue', value.value)
        }

        return () => <label class="checkbox">
            <input type="checkbox" checked={value.value} onChange={onUpdate}/>
            {slots.default?.()}
        </label>
    }
})