import { defineComponent, onMounted, Ref, ref, watch } from "vue"

export default defineComponent({
    props: {
        value: Number,
        placeholder: String,
        max: Number,
        min: Number,
        refreshOnInput: {type: Boolean, default: false},
        focusOnMounted: {type: Boolean, default: false},
        disabled: {type: Boolean, default: false}
    },
    emits: ['updateValue'],
    setup(props, { emit }) {
        const value: Ref<number | undefined> = ref(props.value)

        watch(() => props.value, () => { value.value = props.value })

        const onUpdate = (e: InputEvent) => {
            const newValue = parseInt((e.target as HTMLInputElement).value)
            if(!isNaN(newValue)) {
                value.value = newValue
                emit('updateValue', value.value)
            }
        }

        if(props.focusOnMounted) {
            const dom = ref<HTMLInputElement>()

            onMounted(() => dom.value?.focus())

            return () => {
                const events = {[props.refreshOnInput ? "onInput" : "onChange"]: onUpdate}
                return <input ref={dom} class="input" type="number" max={props.max} min={props.min} disabled={props.disabled} value={value.value} {...events} placeholder={props.placeholder}/>
            }
        }else{
            return () => {
                const events = {[props.refreshOnInput ? "onInput" : "onChange"]: onUpdate}
                return <input class="input" type="number" max={props.max} min={props.min} disabled={props.disabled} value={value.value} {...events} placeholder={props.placeholder}/>
            }
        }

    }
})
