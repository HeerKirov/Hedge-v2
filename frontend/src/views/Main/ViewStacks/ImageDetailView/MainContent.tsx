import { defineComponent } from "vue"
import TopBarTransparentLayout from "@/layouts/layouts/TopBarTransparentLayout"
import TopBarContent from "./TopBarContent"

export default defineComponent({
    setup() {
        const topBarLayoutSlots = {
            topBar() { return <TopBarContent/> },
            default() {}
        }
        return () => <TopBarTransparentLayout v-slots={topBarLayoutSlots}/>
    }
})
