import { computed, defineComponent } from "vue"
import { RouterView } from "vue-router"
import { installAppService } from "@/functions/app"
import { installTitleWatcher } from "@/functions/document/title"
import { installToastManager } from "@/functions/module/toast"
import { installMessageBoxManager } from "@/functions/module/message-box"
import { installWebPopupMenuManager } from "@/functions/document/web-popup-menu"
import { installRouterParamManager } from "@/functions/feature/router"
import { installGlobalKey } from "@/functions/feature/keyboard"
import NotificationModule from "@/layouts/web-modules/NotificationModule"
import MessageBoxModule from "@/layouts/web-modules/MessageBoxModule"
import PopupMenuModule from "@/layouts/web-modules/PopupMenuModule"

export default defineComponent({
    setup() {
        installTitleWatcher()
        installRouterParamManager()
        installMessageBoxManager()
        installWebPopupMenuManager()
        const { handleError } = installToastManager()
        const { appState } = installAppService({handleError})
        const initialized = computed(() => appState.state != null)
        installGlobalKey()

        return () => <>
            {initialized.value && <RouterView/>}
            <MessageBoxModule/>
            <NotificationModule/>
            <PopupMenuModule/>
        </>
    }
})
