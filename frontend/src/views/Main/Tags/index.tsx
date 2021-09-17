import { defineComponent } from "vue"
import TopBarLayout from "@/layouts/layouts/TopBarLayout"
import SplitPane from "@/layouts/layouts/SplitPane"
import ListView from "./ListView"
import TopBarContent from "./TopBarContent"
import PaneCreateView from "./PaneCreateView"
import PaneDetailView from "./PaneDetailView"
import PaneSearchView from "./PaneSearchView"
import { installLocalTagDataContext, installTagPaneContext, installTagListContext, installSearchService } from "./inject"

export default defineComponent({
    setup() {
        const tagPaneContext = installTagPaneContext()
        const tagListContext = installTagListContext()
        installLocalTagDataContext(tagPaneContext, tagListContext)
        installSearchService(tagListContext)

        const { createMode, detailMode, searchMode } = tagPaneContext

        return () => <TopBarLayout v-slots={{
            topBar: () => <TopBarContent/>,
            default: () => <SplitPane showPane={createMode.value != null || detailMode.value != null || searchMode.value } v-slots={{
                default: () => <ListView/>,
                pane: () => createMode.value != null ? <PaneCreateView/> : detailMode.value != null ? <PaneDetailView/> : <PaneSearchView/>
            }}/>
        }}/>
    }
})
