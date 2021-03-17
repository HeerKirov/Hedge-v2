import { computed, defineComponent } from "vue"
import { RouterView } from "vue-router"
import { installTitleWatcher } from "@/functions/document/title"
import { installAppService } from "@/functions/service"
import { installNotificationManager } from "@/functions/message/notification"
import { installMessageBoxManager } from "@/functions/message/message-box"
import { installWebPopupMenuManager } from "@/functions/message/web-popup-menu"
import NotificationModule from "@/layouts/NotificationModule"
import MessageBoxModule from "@/layouts/MessageBoxModule"
import PopupMenuModule from "@/layouts/PopupMenuModule"

export default defineComponent({
    setup() {
        installTitleWatcher()
        installMessageBoxManager()
        const notification = installNotificationManager()
        const { appInfo, appState } = installAppService({ handleError: notification.handleError })
        const initialized = computed(() => appState.state != null)
        if(!appInfo.clientMode) installWebPopupMenuManager()

        return () => <>
            <MessageBoxModule/>
            <NotificationModule/>
            {!appInfo.clientMode && <PopupMenuModule/>}
            {initialized.value && <RouterView/>}
        </>
    }
})