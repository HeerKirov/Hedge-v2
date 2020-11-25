import { computed, defineComponent } from "vue"
import { RouterView } from "vue-router"
import { watchDocumentTitle } from "@/functions/document/title"
import { useAppState } from "@/functions/service"
import ProgressFlag from "@/components/ProgressFlag"

export default defineComponent({
    setup() {
        watchDocumentTitle()

        const appState = useAppState()

        //在appState的登录状态得到确认之前，不会渲染程序组件。
        const loading = computed(() => appState.status.value === "UNKNOWN")

        return () => loading.value ? <div class="fixed center">
            <ProgressFlag/>
        </div> : <RouterView/>
    }
})