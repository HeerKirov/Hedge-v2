import { computed, defineComponent } from "vue"
import { RouterView } from "vue-router"
import { installTitleWatcher } from "@/functions/document/title"
import { installAppService } from "@/functions/service"
import { installNotificationManager } from "@/functions/message/notification"
import { installMessageBoxManager } from "@/functions/message/message-box"
import NotificationModule from "@/layouts/NotificationModule"
import MessageBoxModule from "@/layouts/MessageBoxModule"

export default defineComponent({
    setup() {
        installTitleWatcher()
        installMessageBoxManager()
        const notification = installNotificationManager()
        const { appState } = installAppService({ handleError: notification.handleError })

        const initialized = computed(() => appState.state != null)

        return () => <>
            <MessageBoxModule/>
            <NotificationModule/>
            {initialized.value && <RouterView/>}
        </>
    }
})