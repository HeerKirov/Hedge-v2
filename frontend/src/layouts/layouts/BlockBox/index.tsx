import { defineComponent, Transition } from "vue"
import { watchGlobalKeyEvent } from "@/functions/document/global-key"
import style from "./style.module.scss"

/**
 * 全局覆盖的message box，用来提示消息和确认下一步行动。
 */
export default defineComponent({
    props: {
        visible: Boolean
    },
    emits: ["clickBackground", "esc", "enter"],
    setup(props, { slots, emit }) {
        const clickBackground = () => emit("clickBackground")
        const pressEsc = () => emit("esc")
        const pressEnter = () => emit("enter")

        return () => <div class={style.root}>
            <Transition enterActiveClass={style.transactionActive} leaveActiveClass={style.transactionActive} enterFromClass={style.transactionGoal} leaveToClass={style.transactionGoal}>
                {props.visible && <div class={style.background} onClick={clickBackground}/>}
            </Transition>
            <Transition enterActiveClass={style.transactionEnterActive} leaveActiveClass={style.transactionLeaveActive} enterFromClass={style.transactionEnterFrom} leaveToClass={style.transactionLeaveTo}>
                {props.visible && <Box v-slots={slots} onEsc={pressEsc} onEnter={pressEnter}/>}
            </Transition>
        </div>
    }
})

/**
 * box dom对象。
 */
const Box = defineComponent({
    emits: ["esc", "enter"],
    setup(_, { slots, emit }) {
        watchGlobalKeyEvent(e => {
            if(e.key === "Escape") {
                emit("esc")
            }else if(e.key === "Enter") {
                emit("enter")
            }
            e.preventDefault()
            e.stopPropagation()
        })

        return () => <div class={style.boxFramework}>
            <div class={style.box}>
                {slots.default?.()}
            </div>
        </div>
    }
})
