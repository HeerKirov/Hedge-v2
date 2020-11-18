import { defineComponent } from "vue"
import { RouterView } from "vue-router"
import { watchDocumentTitle } from "@/functions/document/title"
import { provideService } from "@/functions/service"

export default defineComponent({
    setup() {
        provideService()
        watchDocumentTitle()

        return () => <RouterView/>
    }
})