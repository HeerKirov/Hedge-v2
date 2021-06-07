import { defineComponent, PropType, ref, watch } from "vue"
import BlockBox from "@/layouts/layouts/BlockBox"
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

        const blockBoxEvents = {
            onClickBackground() {
                if(task.value?.options.esc) {
                    click(task.value.options.esc)
                }
            },
            onEsc() {
                if(task.value?.options.esc) {
                    click(task.value.options.esc)
                }
            },
            onEnter() {
                if(task.value?.options.enter) {
                    click(task.value.options.enter)
                }
            }
        }

        return () => <BlockBox visible={!!task.value} {...blockBoxEvents}>
            <Content {...task.value!.options} onClick={click}/>
        </BlockBox>
    }
})

const Content = defineComponent({
    props: {
        title: String,
        message: {type: String, required: true},
        detailMessage: {type: String},
        buttons: {type: null as any as PropType<MessageBoxButton[]>, required: true}
    },
    emits: ["click"],
    setup(props, { emit }) {
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
