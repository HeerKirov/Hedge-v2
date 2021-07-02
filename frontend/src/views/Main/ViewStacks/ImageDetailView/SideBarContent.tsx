import { defineComponent } from "vue"
import { SideBar } from "@/layouts/layouts/SideLayout"

export default defineComponent({
    setup() {
        const sideBarSlots = {
            default() {},
            bottom() {}
        }
        return () => <SideBar v-slots={sideBarSlots}/>
    }
})
