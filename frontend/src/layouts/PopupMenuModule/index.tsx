import { defineComponent } from "vue"
import { useWebPopupMenuConsumer } from "@/functions/message/web-popup-menu"
import style from "./style.module.scss"

export default defineComponent({
    setup() {
        const { value: data } = useWebPopupMenuConsumer()

        //TODO 完成popup menu模块
        return () => <div class={style.root}>

        </div>
    }
})