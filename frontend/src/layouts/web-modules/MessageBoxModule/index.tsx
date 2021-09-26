import { defineComponent, PropType, ref, watch } from "vue"
import DialogBox from "@/layouts/layouts/DialogBox"
import { MessageBoxButton, MessageTask, useMessageBoxConsumer } from "@/functions/module/message-box"
import style from "./style.module.scss"
import { interceptGlobalKey } from "@/functions/feature/keyboard";

export default defineComponent({
    setup() {
        const { messageTasks } = useMessageBoxConsumer()

        const task = ref<MessageTask>()

        function refreshTask() {
            if(messageTasks.length > 0 && task.value == undefined) {
                task.value = messageTasks[0]
                messageTasks.splice(0, 1)
            }
        }
        watch(() => messageTasks, refreshTask, {deep: true})

        const click = (action: string) => {
            if(task.value) {
                const resolve = task.value?.resolve
                task.value = undefined
                resolve(action)
                refreshTask()
            }
        }

        const close = () => {
            if(task.value?.options.esc) {
                click(task.value.options.esc)
            }
        }

        return () => <DialogBox class="has-radius-very-large" visible={!!task.value} overflow="hidden" onClose={close} closeOnEscape={!!task.value?.options.esc}>
            <Content {...task.value!.options} onClick={click}/>
        </DialogBox>
    }
})

const Content = defineComponent({
    props: {
        title: String,
        message: {type: String, required: true},
        detailMessage: {type: String},
        buttons: {type: null as any as PropType<MessageBoxButton[]>, required: true},
        enter: String
    },
    emits: {
        click: (_: string) => true
    },
    setup(props, { emit }) {
        if(props.enter) interceptGlobalKey(["Enter"], () => {
            if(props.enter) {
                emit("click", props.enter)
            }
        })

        const onClick = (action: string) => () => emit("click", action)

        return () => <div class={style.content}>
            <p class={style.title}>{props.title}</p>
            <p class={style.message}>{props.message}</p>
            {props.detailMessage && <p class={style.detailMessage}>{props.detailMessage}</p>}
            <div class={style.buttons}>
                {props.buttons.map(btn => <button class={["button", "is-small", "radius-large", btn.type ? `is-${btn.type}` : undefined]} onClick={onClick(btn.action)}>
                    {btn.icon && <span class="icon"><i class={`fa fa-${btn.icon}`}/></span>}
                    <span>{btn.name ?? btn.action}</span>
                </button>)}
            </div>
        </div>
    }
})
