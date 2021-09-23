import { computed, defineComponent } from "vue"
import { useToastConsumer } from "@/functions/module/toast"
import style from "./style.module.scss"

export default defineComponent({
    setup() {
        const { toasts } = useToastConsumer()

        const items = computed(() => toasts.slice(0, 5).map(n => ({
            title: n.title,
            content: n.content,
            style: n.type === "plain" ? undefined : `is-${n.type}`,
            uniqueKey: n.uniqueKey
        })))

        const onClose = (index: number) => () => {
            toasts.splice(index, 1)
        }

        return () => <div class={style.root}>
            {items.value.map((item, i) => <div key={item.uniqueKey} class={["block", "has-border", "is-light", style.item, item.style]}>
                <a class={style.closeButton} onClick={onClose(i)}><span class="icon"><i class="fa fa-times"/></span></a>
                <p class="is-size-medium"><b>{item.title}</b></p>
               {item.content.map(line => <p>{line}</p>)}
            </div>)}
        </div>
    }
})
