import { computed, defineComponent } from "vue"
import { RouterView } from "vue-router"
import { installAppService } from "@/services/app"
import { installDocumentTitle } from "@/services/global/document"
import { installRouterParamManager } from "@/services/global/router"
import { installToastManager } from "@/services/module/toast"
import { installMessageBoxManager } from "@/services/module/message-box"
import { installWebPopupMenuManager } from "@/services/module/web-popup-menu"
import { installGlobalKey } from "@/services/global/keyboard"
import ToastModule from "@/layouts/modules/Toast"
import MessageBoxModule from "@/layouts/modules/MessageBox"
import PopupMenuModule from "@/layouts/modules/PopupMenu"

export default defineComponent({
    setup() {
        installDocumentTitle()
        installRouterParamManager()
        installMessageBoxManager()
        installWebPopupMenuManager()
        const { handleError } = installToastManager()
        const { appState } = installAppService({handleError})
        const initialized = computed(() => appState.state.value != null)
        installGlobalKey()

        return () => <>
            {initialized.value && <RouterView/>}
            <MessageBoxModule/>
            <ToastModule/>
            <PopupMenuModule/>
        </>
    }
})
