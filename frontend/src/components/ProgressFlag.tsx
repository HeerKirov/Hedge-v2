import { defineComponent } from "vue"
import style from "./ProgressFlag.module.scss"

export default defineComponent({
    setup() {
        return () => <progress class={["progress", "is-small", "is-info", style.progressBar]} max="100"></progress>
    }
})