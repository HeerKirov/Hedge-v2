import { defineComponent, Ref, ref, watch } from "vue"

export default defineComponent({
    props: {
        value: Number,
        max: {type: Number, required: true},
        min: {type: Number, required: true},
        step: Number,
        refreshOnInput: {type: Boolean, default: false},
        disabled: {type: Boolean, default: false}
    },
    emits: {
        updateValue: (_: number) => true
    },
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

        return () => {
            const events = {[props.refreshOnInput ? "onInput" : "onChange"]: onUpdate}
            return <input class="range" type="range" max={props.max} min={props.min} step={props.step} disabled={props.disabled} value={value.value} {...events}/>
        }
    }
})
