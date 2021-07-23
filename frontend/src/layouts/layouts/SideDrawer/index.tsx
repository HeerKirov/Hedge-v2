import { defineComponent, inject, InjectionKey, Ref, toRef, Transition } from "vue"
import style from "./style.module.scss"

export default defineComponent({
    props: {
        tab: String
    },
    emits: ["close"],
    setup(props, { emit, slots }) {
        const tab = toRef(props, "tab")

        const close = () => emit("close")

        return () => <>
            <Transition enterFromClass={style.transitionEnterFrom} leaveToClass={style.transitionLeaveTo}
                        enterActiveClass={style.transitionEnterActive} leaveActiveClass={style.transitionLeaveActive}>
                {tab.value && <div class={style.sideDrawerBackground} onClick={close}/>}
            </Transition>
            <Transition enterFromClass={style.transitionEnterFrom} leaveToClass={style.transitionLeaveTo}
                        enterActiveClass={style.transitionEnterActive} leaveActiveClass={style.transitionLeaveActive}>
                {tab.value && <div class={style.sideDrawer}>
                    {slots[tab.value]?.(close)}
                </div>}
            </Transition>
        </>
    }
})
