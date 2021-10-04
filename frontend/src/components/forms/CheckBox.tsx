import { defineComponent, ref, watch } from "vue"

export default defineComponent({
    props: {
        value: Boolean,
        disabled: {type: Boolean, default: false}
    },
    emits: {
        updateValue: (_: boolean) => true
    },
    setup(props, { emit, slots }) {
        const value = ref(props.value)

        watch(() => props.value, v => value.value = v)

        const onUpdate = (e: Event) => {
            value.value = (e.target as HTMLInputElement).checked
            emit('updateValue', value.value)
        }

        return () => <label class={{"checkbox": true, "disabled": props.disabled}}>
            <input type="checkbox" checked={value.value} disabled={props.disabled} onChange={onUpdate}/>
            {slots.default?.()}
        </label>
    }
})
