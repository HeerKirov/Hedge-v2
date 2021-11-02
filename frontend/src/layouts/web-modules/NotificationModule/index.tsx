import { computed, defineComponent, PropType, TransitionGroup } from "vue"
import { ToastType, useToastConsumer } from "@/functions/module/toast"
import style from "./style.module.scss"

export default defineComponent({
    setup() {
        const { toasts } = useToastConsumer()

        const items = computed(() => toasts.slice(0, 12))

        const onClose = (index: number) => () => toasts.splice(index, 1)

        return () => <TransitionGroup tag="div" class={style.root} enterFromClass={style.transitionEnterFrom}
                                      leaveToClass={style.transitionLeaveTo}
                                      enterActiveClass={style.transitionEnterActive}
                                      leaveActiveClass={style.transitionLeaveActive}
                                      moveClass={style.transitionListMove}>
            {items.value.map((item, i) => <ToastItem key={item.uniqueKey} onClose={onClose(i)} title={item.title} type={item.type} content={item.content}/>)}
        </TransitionGroup>
    }
})

const ToastItem = defineComponent({
    props: {
        title: {type: String, required: true},
        type: {type: String as PropType<ToastType>, required: true},
        content: String
    },
    emits: {
        close: () => true
    },
    setup(props, { emit }) {
        return () => <div class={[style.item, colorStyle[props.type]]}>
            <div class={style.titleContent}>
                <b class={style.title}>{props.title}</b>
                <a class={style.closeButton} onClick={() => emit("close")}><span class="icon"><i class="fa fa-times"/></span></a>
            </div>
            {props.content && <p class={style.content}>{props.content}</p>}
        </div>
    }
})

const colorStyle: {[key in ToastType]: string} = {
    success: style.isSuccess,
    warning: style.isWarning,
    danger: style.isDanger,
    info: style.isInfo,
    plain: style.isPlain,
}
