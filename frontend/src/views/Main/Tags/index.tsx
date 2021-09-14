import { defineComponent } from "vue"
import TopBarLayout from "@/layouts/layouts/TopBarLayout"
import SplitPane from "@/layouts/layouts/SplitPane"
import ListView from "./ListView"
import TopBarContent from "./TopBarContent"
import PaneCreateView from "./PaneCreateView"
import PaneDetailView from "./PaneDetailView"
import PaneSearchView from "./PaneSearchView"
import {
    installTagPaneContext, installTagListContext, installEditLock,
    installSearchService, installExpandedViewerContext, installExpandedInfo
} from "./inject"

export default defineComponent({
    setup() {
        const { createMode, detailMode, searchMode } = installTagPaneContext()
        const tagListContext = installTagListContext()
        const expandedInfo = installExpandedInfo(tagListContext)
        installExpandedViewerContext(expandedInfo)
        installSearchService(tagListContext)
        installEditLock()

        return () => <TopBarLayout v-slots={{
            topBar: () => <TopBarContent/>,
            default: () => <SplitPane showPane={createMode.value != null || detailMode.value != null || searchMode.value } v-slots={{
                default: () => <ListView/>,
                pane: () => createMode.value != null ? <PaneCreateView/> : detailMode.value != null ? <PaneDetailView/> : <PaneSearchView/>
            }}/>
        }}/>
    }
})
