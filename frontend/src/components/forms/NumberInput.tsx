import { ComponentPublicInstance, defineComponent, nextTick, PropType, Ref, ref, watch } from "vue"
import { createKeyboardEventChecker, KeyEvent, KeyPress, toKeyEvent } from "@/services/global/keyboard"

export default defineComponent({
    props: {
        value: Number,
        placeholder: String,
        max: Number,
        min: Number,
        refreshOnInput: {type: Boolean, default: false},
        focusOnMounted: {type: Boolean, default: false},
        disabled: {type: Boolean, default: false},
        acceptEventKeys: null as any as PropType<KeyPress | KeyPress[]>,
        onKeypress: Function as PropType<(e: KeyEvent) => void>
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
            props.onKeypress?.(toKeyEvent(e))
        }

        //加载后聚焦
        const focusOnMountedCallback = (props.focusOnMounted || undefined) && async function(el: Element | ComponentPublicInstance | null) {
            const ref = (el as HTMLInputElement | null)
            if(ref) {
                await nextTick()
                ref.focus()
            }
        }

        const events = {[props.refreshOnInput ? "onInput" : "onChange"]: onUpdate, onKeydown}

        return () => <input ref={focusOnMountedCallback} class="input" type="number" max={props.max} min={props.min} disabled={props.disabled} value={value.value} {...events} placeholder={props.placeholder}/>
    }
})
