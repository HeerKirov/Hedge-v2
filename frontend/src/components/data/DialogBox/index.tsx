import { defineComponent, onBeforeMount, PropType, Transition } from "vue"
import { watchGlobalKeyEvent } from "@/services/global/keyboard"
import style from "./style.module.scss"

export default defineComponent({
    props: {
        visible: Boolean,
        position: {type: String as PropType<"absolute" | "fixed">, default: "fixed"},
        overflow: {type: String as PropType<"auto" | "hidden" | "default">, default: "default"},
        closeOnClickBackground: {type: Boolean, default: true},
        closeOnEscape: {type: Boolean, default: true}
    },
    emits: {
        close: () => true
    },
    inheritAttrs: false,
    setup(props, { emit, slots, attrs }) {
        const close = () => emit("close")

        return () => <>
            <Transition enterActiveClass={style.transactionActive} leaveActiveClass={style.transactionActive} enterFromClass={style.transactionGoal} leaveToClass={style.transactionGoal}>
                {props.visible && <div class={{[style.background]: true, [style.absolute]: props.position === "absolute"}}
                                       onClick={props.closeOnClickBackground ? close : undefined}/>}
            </Transition>
            <Transition enterActiveClass={style.transactionEnterActive} leaveActiveClass={style.transactionLeaveActive} enterFromClass={style.transactionEnterFrom} leaveToClass={style.transactionLeaveTo}>
                {props.visible && <BoxFramework v-slots={slots} {...attrs} onClose={close}
                                                position={props.position} overflow={props.overflow} closeOnEscape={props.closeOnEscape}/>}
            </Transition>
        </>
    }
})

const BoxFramework = defineComponent({
    props: {
        position: {type: String as PropType<"absolute" | "fixed">, required: true},
        overflow: {type: String as PropType<"auto" | "hidden" | "default">, required: true},
        closeOnEscape: Boolean
    },
    emits: {
        close: () => true
    },
    inheritAttrs: false,
    setup(props, { emit, slots, attrs }) {
        watchGlobalKeyEvent(e => {
            e.stopPropagation()
            e.preventDefault()
            if(e.key === "Escape" && props.closeOnEscape) {
                emit("close")
                return
            }
        })

        onBeforeMount(() => {
            //挂载dialog时，添加一个额外的小动作，使当前正在聚焦的元素失去焦点，以避免造成“焦点在input等元素上造成快捷键失灵”的问题
            const el = document.activeElement
            if(el instanceof HTMLElement) {
                el.blur()
            }
        })

        return () => <div class={{[style.boxFramework]: true, [style.absolute]: props.position === "absolute"}}>
            <div class={["popup-block", `is-overflow-${props.overflow}`]} {...attrs}>
                {slots.default?.()}
            </div>
        </div>
    }
})
