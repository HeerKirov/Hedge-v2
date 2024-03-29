import { ComponentPublicInstance, defineComponent, nextTick, PropType, ref, toRef, watch } from "vue"
import { createKeyboardEventChecker, interceptGlobalKey, KeyEvent, KeyPress, toKeyEvent } from "@/services/global/keyboard"

export default defineComponent({
    props: {
        value: String,
        placeholder: String,
        type: {type: null as any as PropType<"text" | "password">, default: "text"},
        disabled: {type: Boolean, default: false},
        refreshOnInput: {type: Boolean, default: false},
        focusOnMounted: {type: Boolean, default: false},
        focusOnKeypress: null as any as PropType<KeyPress | KeyPress[]>,
        acceptEventKeys: null as any as PropType<KeyPress | KeyPress[]>,
        onKeypress: Function as PropType<(e: KeyEvent) => void>
    },
    emits: {
        updateValue: (_: string) => true
    },
    setup(props, { emit }) {
        const type = toRef(props, 'type')
        const value = ref(props.value)

        watch(() => props.value, () => { value.value = props.value })

        const onUpdate = (e: InputEvent) => {
            value.value = (e.target as HTMLInputElement).value
            emit('updateValue', value.value)
        }

        const acceptKeyChecker = createKeyboardEventChecker(props.acceptEventKeys)
        const defaultAcceptKeyChecker = createKeyboardEventChecker("Meta+Enter")
        const onKeydown = (e: KeyboardEvent) => {
            if(!composition) {
                if(!(acceptKeyChecker(e) || defaultAcceptKeyChecker(e))) {
                    e.stopPropagation()
                    e.stopImmediatePropagation()
                }
                props.onKeypress?.(toKeyEvent(e))
            }
        }

        //输入法合成器防抖
        let composition = false
        const onCompositionstart = () => composition = true
        const onCompositionend = () => composition = false

        //聚焦
        let inputRef: HTMLInputElement | null = null

        const mountedCallback = (props.focusOnKeypress || props.focusOnMounted || undefined) && async function(el: Element | ComponentPublicInstance | null) {
            const ref = (el as HTMLInputElement | null)
            if(props.focusOnKeypress) inputRef = ref
            if(props.focusOnMounted && ref) {
                await nextTick()
                ref.focus()
            }
        }

        //按键时聚焦
        if(props.focusOnKeypress) interceptGlobalKey(props.focusOnKeypress, () => {
            inputRef?.focus()
        })

        const events = {[props.refreshOnInput ? "onInput" : "onChange"]: onUpdate, onKeydown, onCompositionstart, onCompositionend}

        return () => <input ref={mountedCallback} class="input is-monaco" type={type.value} disabled={props.disabled} value={value.value} placeholder={props.placeholder} {...events}/>
    }
})
