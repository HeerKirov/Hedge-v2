import { defineComponent } from "vue"
import { ExpandArea } from "@/layouts/topbars/Query"
import TopBarLayout from "@/layouts/layouts/TopBarLayout"
import SplitPane from "@/layouts/layouts/SplitPane"
import TopBarContent from "./TopBarContent"
import ListView from "./ListView"
import PaneDetailView from "./PaneDetailView"
import { installSourceImageContext } from "./inject"

export default defineComponent({
    setup() {
        const { pane: { detailMode }, querySchema: { schema, expanded } } = installSourceImageContext()

        const topBarLayoutSlots = {
            topBar: () => <TopBarContent/>,
            expand: () => schema.value && <ExpandArea schema={schema.value}/>,
            default: () => <SplitPane showPane={detailMode.value !== null} v-slots={{
                default: () => <ListView/>,
                pane: () => <PaneDetailView/>
            }}/>
        }
        return () => <TopBarLayout v-slots={topBarLayoutSlots} expanded={expanded.value} onUpdateExpanded={v => expanded.value = v}/>
    }
})
