import { defineComponent, onMounted, onUnmounted, PropType, ref, watch, Transition } from "vue"
import { MessageBoxButton, MessageTask, useMessageBoxConsumer } from "@/functions/document/message-box"
import style from "./style.module.scss"

export default defineComponent({
    setup() {
        const { messageTasks } = useMessageBoxConsumer()

        const task = ref<MessageTask>()

        const click = (action: string) => {
            if(task.value) {
                const resolve = task.value?.resolve
                task.value = undefined
                resolve(action)
                refreshTask()
            }
        }

        function refreshTask() {
            if(messageTasks.length > 0 && task.value == undefined) {
                task.value = messageTasks[0]
                messageTasks.splice(0, 1)
            }
        }
        watch(() => messageTasks, refreshTask, {deep: true})

        return () => <div class={style.root}>
            <Transition enterActiveClass={style.transactionActive} leaveActiveClass={style.transactionActive} enterFromClass={style.transactionGoal} leaveToClass={style.transactionGoal}>
                {task.value && <div class={style.background} onClick={task.value!.options.esc ? (() => task.value?.options.esc && click(task.value.options.esc)) : undefined}/>}
            </Transition>
            <Transition enterActiveClass={style.transactionEnterActive} leaveActiveClass={style.transactionLeaveActive} enterFromClass={style.transactionEnterFrom} leaveToClass={style.transactionLeaveTo}>
                {task.value && <Box {...task.value!.options} onClick={click}/>}
            </Transition>
        </div>
    }
})

const Box = defineComponent({
    props: {
        title: String,
        message: {type: String, required: true},
        buttons: {type: null as any as PropType<MessageBoxButton[]>, required: true},
        enter: String,
        esc: String
    },
    emits: ["click"],
    setup(props, { emit }) {
        const onClick = (action: string) => () => emit("click", action)

        function escapeEvent(e: KeyboardEvent) {
            if(props.esc && e.key === "Escape") {
                emit("click", props.esc)
            }else if(props.enter && e.key === "Enter") {
                emit("click", props.enter)
            }
            e.returnValue = false
        }
        onMounted(() => document.addEventListener("keydown", escapeEvent))
        onUnmounted(() => document.removeEventListener("keydown", escapeEvent))

        return () => <div class={style.boxFramework}>
            <div class={style.box}>
                <p class={style.title}>{props.title}</p>
                <p class={style.message}>{props.message}</p>
                <div class={style.buttons}>
                    {props.buttons.map(btn => <button class={["button", "is-small", "radius-large", btn.type ? `is-${btn.type}` : undefined]} onClick={onClick(btn.action)}>
                        {btn.icon && <span class="icon"><i class={`fa fa-${btn.icon}`}/></span>}
                        <span>{btn.name ?? btn.action}</span>
                    </button>)}
                </div>
            </div>
        </div>
    }
})