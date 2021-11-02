import { defineComponent, PropType, Ref, ref, watch } from "vue"
import { createKeyboardEventChecker, KeyPress } from "@/functions/feature/keyboard"

export default defineComponent({
    props: {
        value: Number,
        max: {type: Number, required: true},
        min: {type: Number, required: true},
        step: Number,
        refreshOnInput: {type: Boolean, default: false},
        disabled: {type: Boolean, default: false},
        acceptEventKeys: null as any as PropType<KeyPress | KeyPress[]>
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

        const acceptKeyChecker = createKeyboardEventChecker(props.acceptEventKeys)
        const defaultAcceptKeyChecker = createKeyboardEventChecker("Meta+Enter")
        const onKeydown = (e: KeyboardEvent) => {
            if(!acceptKeyChecker(e) && !defaultAcceptKeyChecker(e)) {
                e.stopPropagation()
                e.stopImmediatePropagation()
            }
        }

        const events = {[props.refreshOnInput ? "onInput" : "onChange"]: onUpdate, onKeydown}

        return () => <input class="range" type="range" max={props.max} min={props.min} step={props.step} disabled={props.disabled} value={value.value} {...events}/>
    }
})
