import { defineComponent, onMounted, PropType, ref, toRef, watch } from "vue"

export default defineComponent({
    props: {
        value: String,
        placeholder: String,
        refreshOnInput: {type: Boolean, default: false},
        focusOnMounted: {type: Boolean, default: false},
        disabled: {type: Boolean, default: false}
    },
    emits: ['updateValue'],
    setup(props, { emit }) {
        const value = ref(props.value)

        watch(() => props.value, () => { value.value = props.value })

        const onUpdate = (e: InputEvent) => {
            value.value = (e.target as HTMLInputElement).value
            emit('updateValue', value.value)
        }

        if(props.focusOnMounted) {
            const dom = ref<HTMLInputElement>()

            onMounted(() => dom.value?.focus())

            return () => {
                const events = {[props.refreshOnInput ? "onInput" : "onChange"]: onUpdate}
                return <textarea ref={dom} class="textarea is-monaco" disabled={props.disabled} value={value.value} {...events} placeholder={props.placeholder}/>
            }
        }else{
            return () => {
                const events = {[props.refreshOnInput ? "onInput" : "onChange"]: onUpdate}
                return <textarea class="textarea is-monaco" value={value.value} disabled={props.disabled} {...events} placeholder={props.placeholder}/>
            }
        }
    }
})
