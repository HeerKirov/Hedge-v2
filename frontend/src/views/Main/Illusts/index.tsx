import { defineComponent } from "vue"
import TopBarLayout from "@/layouts/layouts/TopBarLayout"
import TopBarContent from "./TopBarContent"
import ListView from "./ListView"
import { installIllustContext } from "./inject"

export default defineComponent({
    setup() {
        installIllustContext()

        return () => <TopBarLayout v-slots={{
            topBar: () => <TopBarContent/>,
            default: () => <ListView/>
        }}/>
    }
})
