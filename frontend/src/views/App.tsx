import { computed, defineComponent } from "vue"
import { RouterView } from "vue-router"
import { installTitleWatcher } from "@/functions/document/title"
import { installAppService } from "@/functions/service"
import { installNotificationManager } from "@/functions/notification"
import NotificationModule from "@/layouts/NotificationModule"

export default defineComponent({
    setup() {
        installTitleWatcher()
        const notification = installNotificationManager()
        const { appState } = installAppService({ handleError: notification.handleError })

        const initialized = computed(() => appState.state != null)

        return () => <>
            <NotificationModule/>
            {initialized.value && <RouterView/>}
        </>
    }
})