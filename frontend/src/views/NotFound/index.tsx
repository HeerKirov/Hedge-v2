import { defineComponent } from "vue"
import NotFoundNotification from "@/layouts/ForbiddenNotification"

export default defineComponent({
    setup() {
        return () => <NotFoundNotification/>
    }
})