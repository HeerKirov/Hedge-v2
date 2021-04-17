import { defineComponent } from "vue"
import NotFoundNotification from "@/layouts/layouts/ForbiddenNotification"

export default defineComponent({
    setup() {
        return () => <NotFoundNotification/>
    }
})
