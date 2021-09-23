import { computed, defineComponent } from "vue"
import { RouterView } from "vue-router"
import { installAppService } from "@/functions/app"
import { installTitleWatcher } from "@/functions/document/title"
import { installToastManager } from "@/functions/module/toast"
import { installMessageBoxManager } from "@/functions/module/message-box"
import { installWebPopupMenuManager } from "@/functions/document/web-popup-menu"
import { installNavigatorManager } from "@/functions/feature/navigator/navigator-event"
import { installGlobalKey } from "@/functions/feature/keyboard"
import NotificationModule from "@/layouts/web-modules/NotificationModule"
import MessageBoxModule from "@/layouts/web-modules/MessageBoxModule"
import PopupMenuModule from "@/layouts/web-modules/PopupMenuModule"

export default defineComponent({
    setup() {
        installTitleWatcher()
        installNavigatorManager()
        installMessageBoxManager()
        installWebPopupMenuManager()
        const notification = installToastManager()
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
