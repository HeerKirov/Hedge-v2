import { defineComponent, inject, InjectionKey, Ref, toRef, Transition } from "vue"
import style from "./style.module.scss"
import { watchGlobalKeyEvent } from "@/functions/document/global-key";

export default defineComponent({
    props: {
        tab: String
    },
    emits: ["close"],
    setup(props, { emit, slots }) {
        const tab = toRef(props, "tab")

        const close = () => emit("close")

        watchGlobalKeyEvent(e => {
            if(tab.value) {
                if(e.key === "Escape") {
                    close()
                }
                //截断按键事件继续向前传播，使按键事件只能作用在side drawer内
                e.stopPropagation()
            }
        })

        return () => <>
            <Transition enterFromClass={style.transitionEnterFrom} leaveToClass={style.transitionLeaveTo}
                        enterActiveClass={style.transitionEnterActive} leaveActiveClass={style.transitionLeaveActive}>
                {tab.value && <div class={style.sideDrawerBackground} onClick={close}/>}
            </Transition>
            <Transition enterFromClass={style.transitionEnterFrom} leaveToClass={style.transitionLeaveTo}
                        enterActiveClass={style.transitionEnterActive} leaveActiveClass={style.transitionLeaveActive}>
                {tab.value && <SideDrawerContent v-slots={{default: slots[tab.value]}} onClose={close}/>}
            </Transition>
        </>
    }
})

const SideDrawerContent = defineComponent({
    emits: ["close"],
    setup(_, { emit, slots }) {
        const close = () => emit("close")

        return () => <div class={style.sideDrawer}>
            <div class={style.topBar}>
                <button class="square button is-white" onClick={close}>
                    <span class="icon"><i class="fa fa-times"/></span>
                </button>
            </div>
            <div class={style.content}>
                {slots.default?.()}
            </div>
        </div>
    }
})
