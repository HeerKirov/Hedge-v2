import { defineComponent } from "vue"
import TopBarLayout from "@/layouts/TopBarLayout"
import TopBarContent from "./TopBarContent"
import ListView from "./ListView"

export default defineComponent(function() {
    return () => <TopBarLayout v-slots={{
        topBar: () => <TopBarContent/>,
        default: () => <ListView/>
    }}/>
})