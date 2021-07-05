import { defineComponent, onMounted, PropType, ref, toRef, watch } from "vue"

export default defineComponent({
    props: {
        value: String,
        placeholder: String,
        type: {type: null as any as PropType<"text" | "password">, default: "text"},
        refreshOnInput: {type: Boolean, default: false},
        focusOnMounted: {type: Boolean, default: false},
        disabled: {type: Boolean, default: false}
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

        const keyEventPrevent = (e: KeyboardEvent) => {
            e.stopPropagation()
            e.stopImmediatePropagation()
        }

        if(props.focusOnMounted) {
            const dom = ref<HTMLInputElement>()

            onMounted(() => dom.value?.focus())

            return () => {
                const events = {[props.refreshOnInput ? "onInput" : "onChange"]: onUpdate, "onKeydown": keyEventPrevent}
                return <input ref={dom} class="input is-monaco" type={type.value} disabled={props.disabled} value={value.value} {...events} placeholder={props.placeholder}/>
            }
        }else{
            return () => {
                const events = {[props.refreshOnInput ? "onInput" : "onChange"]: onUpdate, "onKeydown": keyEventPrevent}
                return <input class="input is-monaco" type={type.value} value={value.value} disabled={props.disabled} {...events} placeholder={props.placeholder}/>
            }
        }
    }
})
