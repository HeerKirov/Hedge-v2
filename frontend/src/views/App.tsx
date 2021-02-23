import { defineComponent } from "vue"
import { RouterView } from "vue-router"
import { installTitleWatcher } from "@/functions/document/title"
import { installAppService } from "@/functions/service"
import { installNotificationManager } from "@/functions/notification"
import NotificationModule from "@/layouts/NotificationModule"

export default defineComponent({
    setup() {
        installTitleWatcher()
        installNotificationManager()
        installAppService()

        return () => <>
            <NotificationModule/>
            <RouterView/>
        </>
    }
})