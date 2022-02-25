import { defineComponent, Transition } from "vue"
import TopBar from "@/components/layouts/SideLayout/TopBar"
import style from "./style.module.scss"

/**
 * 一个包装区域，提供：
 * - top bar区域。
 * - 主要内容显示区域。
 * - top bar扩展区域。
 */
export default defineComponent({
    props: {
        expanded: Boolean
    },
    emits: {
        updateExpanded: (_: boolean) => true
    },
    setup(props, { emit, slots }) {
        return () => <div class={style.topBarLayout}>
            {slots.default && <div class={style.mainContent}>
                {slots.default?.()}
            </div>}

            <Transition enterActiveClass={style.transactionActive} leaveActiveClass={style.transactionActive} enterFromClass={style.transactionGoal} leaveToClass={style.transactionGoal}>
                {props.expanded && <div class={style.expandBackground} onClick={() => emit("updateExpanded", false)}/>}
            </Transition>
            <Transition enterActiveClass={style.transactionEnterActive} leaveActiveClass={style.transactionLeaveActive} enterFromClass={style.transactionGoal} leaveToClass={style.transactionGoal}>
                {props.expanded && <div class={style.expandContent}>
                    {slots.expand?.()}
                </div>}
            </Transition>
            {slots.topBar && <TopBar>
                {slots.topBar?.()}
            </TopBar>}
        </div>
    }
})
