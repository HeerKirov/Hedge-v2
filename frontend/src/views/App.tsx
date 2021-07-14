import { computed, defineComponent } from "vue"
import { RouterView } from "vue-router"
import { installAppService } from "@/functions/app"
import { installGlobalKey } from "@/functions/document/global-key"
import { installTitleWatcher } from "@/functions/document/title"
import { installNotificationManager } from "@/functions/document/notification"
import { installMessageBoxManager } from "@/functions/document/message-box"
import { installWebPopupMenuManager } from "@/functions/document/web-popup-menu"
import { installNavigatorManager } from "@/functions/navigator/navigator-event"
import NotificationModule from "@/layouts/web-modules/NotificationModule"
import MessageBoxModule from "@/layouts/web-modules/MessageBoxModule"
import PopupMenuModule from "@/layouts/web-modules/PopupMenuModule"

export default defineComponent({
    setup() {
        installTitleWatcher()
        installNavigatorManager()
        installMessageBoxManager()
        installWebPopupMenuManager()
        const notification = installNotificationManager()
        const { appInfo, appState } = installAppService({ handleError: notification.handleError })
        const initialized = computed(() => appState.state != null)
        installGlobalKey(appInfo)

        return () => <>
            <MessageBoxModule/>
            <NotificationModule/>
            <PopupMenuModule/>
            {initialized.value && <RouterView/>}
        </>
    }
})
