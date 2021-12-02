import { defineComponent } from "vue"
import TopBarLayout from "@/layouts/layouts/TopBarLayout"
import SplitPane from "@/layouts/layouts/SplitPane"
import TopBarContent from "./TopBarContent"
import ListView from "./ListView"
import PaneDetailView from "./PaneDetailView"
import { installSourceImageContext } from "./inject"

export default defineComponent({
    setup() {
        const { pane: { detailMode } } = installSourceImageContext()

        return () => <TopBarLayout v-slots={{
            topBar: () => <TopBarContent/>,
            default: () => <SplitPane showPane={detailMode.value !== null} v-slots={{
                default: () => <ListView/>,
                pane: () => <PaneDetailView/>
            }}/>
        }}/>
    }
})
