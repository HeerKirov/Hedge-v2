import { defineComponent } from "vue"
import TopBarLayout from "@/layouts/layouts/TopBarLayout"
import SplitPane from "@/layouts/layouts/SplitPane"
import TopBarContent from "./TopBarContent"
import ListView from "./ListView"

export default defineComponent({
    setup() {
        return () => <TopBarLayout v-slots={{
            topBar: () => <TopBarContent/>,
            default: () => <SplitPane showPane={false} v-slots={{
                sideBar: () => undefined,
                default: () => <ListView/>
            }}/>
        }}/>
    }
})
