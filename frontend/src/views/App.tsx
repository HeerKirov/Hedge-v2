import { computed, defineComponent } from "vue"
import { RouterView } from "vue-router"
import { installAppService } from "@/functions/app"
import { installTitleWatcher } from "@/functions/document/title"
import { installNotificationManager } from "@/functions/document/notification"
import { installMessageBoxManager } from "@/functions/document/message-box"
import { installWebPopupMenuManager } from "@/functions/document/web-popup-menu"
import { installNavigatorManager } from "@/functions/navigator/navigator-event"
import NotificationModule from "@/layouts/modules/NotificationModule"
import MessageBoxModule from "@/layouts/modules/MessageBoxModule"
import PopupMenuModule from "@/layouts/modules/PopupMenuModule"

export default defineComponent({
    setup() {
        installTitleWatcher()
        installNavigatorManager()
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
