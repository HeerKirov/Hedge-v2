import { defineComponent } from "vue"
import { useWebPopupMenuConsumer } from "@/functions/document/web-popup-menu"
import style from "./style.module.scss"

export default defineComponent({
    setup() {
        const { value: data } = useWebPopupMenuConsumer()

        //FUTURE 完成popup menu模块
        return () => <div class={style.root}>

        </div>
    }
})