import { defineComponent } from "vue"
import NotFoundNotification from "@/layouts/pages/ForbiddenPage"

export default defineComponent({
    setup() {
        return () => <NotFoundNotification/>
    }
})
