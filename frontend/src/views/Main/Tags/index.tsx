import { defineComponent } from "vue"
import TopBarLayout from "@/layouts/layouts/TopBarLayout"
import SplitPane from "@/layouts/layouts/SplitPane"
import ListView from "./ListView"
import TopBarContent from "./TopBarContent"
import PaneDetailView from "./PaneDetailView"
import { installTagPaneContext, installTagListContext } from "./inject"

export default defineComponent({
    setup() {
        const { detailMode } = installTagPaneContext()
        installTagListContext()

        return () => <div>
            <TopBarLayout v-slots={{
                topBar: () => <TopBarContent/>,
                default: () => <SplitPane showPane={detailMode.value != null} v-slots={{
                    default: () => <ListView/>,
                    pane: () => <PaneDetailView/>
                }}/>
            }}/>
        </div>
    }
})
