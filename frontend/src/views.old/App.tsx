import { defineComponent } from "vue"
import { RouterView } from "vue-router"
import { watchDocumentTitle } from "@/functions/document/title"

export default defineComponent({
    setup() {
        watchDocumentTitle()

        return () => <RouterView/>
    }
})