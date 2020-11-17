import { defineComponent } from "vue"
import { RouterView } from "vue-router"
import { useDocumentTitle } from "@/functions/document/title"
import { useStateService } from "@/functions/service"

export default defineComponent({
    setup() {
        useDocumentTitle()
        useStateService()

        return () => <RouterView/>
    }
})