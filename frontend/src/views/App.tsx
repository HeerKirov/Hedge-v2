import { defineComponent } from "vue"
import { RouterView } from "vue-router"
import { installTitleWatcher } from "@/functions/document/title"
import { installAppService } from "@/functions/service"

export default defineComponent({
    setup() {
        installTitleWatcher()
        installAppService()

        return () => <RouterView/>
    }
})