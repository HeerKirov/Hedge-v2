import { defineComponent } from "vue"
import NotFoundNotification from "@/layouts/NotFoundNotification"

export default defineComponent({
    setup() {
        return () => <NotFoundNotification/>
    }
})