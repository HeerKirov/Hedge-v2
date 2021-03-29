import { defineComponent, inject, InjectionKey, Ref, ref, Transition } from "vue"
import TopBar from "@/layouts/SideLayout/TopBar"
import style from "./style.module.scss"

/**
 * 控制top bar扩展区域显示的开关。是可选的依赖属性。如果该属性不存在，就会在layout内维护此属性。
 */
export const topBarExpandSwitchInjection: InjectionKey<Ref<boolean>> = Symbol()

/**
 * 一个包装区域，提供：
 * - top bar区域。
 * - 主要内容显示区域。
 * - top bar扩展区域。
 */
export default defineComponent({
    setup(_, { slots }) {
        const expand = inject(topBarExpandSwitchInjection, () => ref(false), true)

        return () => <div class={style.topBarLayout}>
            {slots.default && <div class={style.mainContent}>
                {slots.default?.()}
            </div>}

            <Transition enterActiveClass={style.transactionActive} leaveActiveClass={style.transactionActive} enterFromClass={style.transactionGoal} leaveToClass={style.transactionGoal}>
                {expand.value && <div class={style.expandBackground} onClick={() => expand.value = false}/>}
            </Transition>
            <Transition enterActiveClass={style.transactionEnterActive} leaveActiveClass={style.transactionLeaveActive} enterFromClass={style.transactionGoal} leaveToClass={style.transactionGoal}>
                {expand.value && <div class={style.expandContent}>
                    {slots.expand?.()}
                </div>}
            </Transition>
            {slots.topBar && <TopBar>
                {slots.topBar?.()}
            </TopBar>}
        </div>
    }
})