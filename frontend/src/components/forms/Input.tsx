import { ComponentPublicInstance, defineComponent, nextTick, PropType, ref, toRef, watch } from "vue"
import { createKeyboardEventChecker, KeyEvent, KeyPress, toKeyEvent } from "@/functions/feature/keyboard"

export default defineComponent({
    props: {
        value: String,
        placeholder: String,
        type: {type: null as any as PropType<"text" | "password">, default: "text"},
        refreshOnInput: {type: Boolean, default: false},
        focusOnMounted: {type: Boolean, default: false},
        disabled: {type: Boolean, default: false},
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
                if(!acceptKeyChecker(e) && !defaultAcceptKeyChecker(e)) {
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

        //加载后聚焦
        const focusOnMountedCallback = (props.focusOnMounted || undefined) && async function(el: Element | ComponentPublicInstance | null) {
            const ref = (el as HTMLInputElement | null)
            if(ref) {
                await nextTick()
                ref.focus()
            }
        }

        const events = {[props.refreshOnInput ? "onInput" : "onChange"]: onUpdate, onKeydown, onCompositionstart, onCompositionend}

        return () => <input ref={focusOnMountedCallback} class="input is-monaco" type={type.value} disabled={props.disabled} value={value.value} placeholder={props.placeholder} {...events}/>
    }
})
