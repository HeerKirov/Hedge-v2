import { defineComponent } from "vue"
import SiteBoard from "./SiteBoard"
import style from "./style.module.scss"

export default defineComponent({
    setup() {
        return () => <div class={style.root}>
            <p class="mb-2 is-size-medium">来源站点</p>
            <SiteBoard/>
        </div>
    }
})
