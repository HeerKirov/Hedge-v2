import { defineComponent } from "vue"
import style from "./style.module.scss"

export default defineComponent({
    setup() {
        return () => <div class={style.listView}>
            <div class={style.listItem}>

            </div>
            <div class={style.listItem}>

            </div>
            <div class={style.listItem}>

            </div>
        </div>
    }
})
