import { defineComponent } from "vue"
import TopBarLayout from "@/layouts/TopBarLayout"
import SplitPane from "@/layouts/SplitPane"
import TopBarContent from "./TopBarContent"
import ListView from "./ListView"
// import PaneDetailView from "./PaneDetailView"
// import PaneCreateView from "./PaneCreateView"
import { installTopicContext } from "./inject"


export default defineComponent({
    setup() {
        const context = installTopicContext()

        const { createMode, detailMode } = context

        return () => <div>
            <TopBarLayout v-slots={{
                topBar: () => <TopBarContent/>,
                default: () => <SplitPane showPane={createMode.value != null || detailMode.value != null} v-slots={{
                    default: () => <ListView/>,
                    pane: () => <div/>
                    // pane: () => createMode.value != null ? <PaneCreateView/> : <PaneDetailView/>
                }}/>
            }}/>
        </div>
    }
})