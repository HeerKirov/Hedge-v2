import { defineComponent } from "vue"
import TopBarLayout from "@/components/layouts/TopBarLayout"
import SplitPane from "@/components/layouts/SplitPane"
import TopBarContent from "./TopBarContent"
import ListView from "./ListView"
import PaneDetailView from "./PaneDetailView"
import PaneCreateView from "./PaneCreateView"
import { installAnnotationContext } from "./inject"


export default defineComponent({
    setup() {
        const { createMode, detailMode } = installAnnotationContext()

        return () => <div>
            <TopBarLayout v-slots={{
                topBar: () => <TopBarContent/>,
                default: () => <SplitPane showPane={createMode.value != null || detailMode.value != null} v-slots={{
                    default: () => <ListView/>,
                    pane: () => createMode.value != null ? <PaneCreateView/> : <PaneDetailView/>
                }}/>
            }}/>
        </div>
    }
})
