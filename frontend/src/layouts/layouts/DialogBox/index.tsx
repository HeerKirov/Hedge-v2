import { defineComponent, PropType, Transition } from "vue"
import { interceptGlobalKey } from "@/functions/feature/keyboard"
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
        if(props.closeOnEscape) interceptGlobalKey(["Escape"], () => emit("close"))

        return () => <div class={{[style.boxFramework]: true, [style.absolute]: props.position === "absolute"}}>
            <div class={["popup-block", `is-overflow-${props.overflow}`]} {...attrs}>
                {slots.default?.()}
            </div>
        </div>
    }
})
