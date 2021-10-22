import { defineComponent } from "vue"
import TopBarLayout from "@/layouts/layouts/TopBarLayout"
import TopBarContent from "./TopBarContent"
import PanelCalendar from "./PanelCalendar"
import PanelTimeline from "./PanelTimeline"
import { installPartitionContext } from "./inject"

export default defineComponent({
    setup() {
        const { viewMode } = installPartitionContext()

        return () => <>
            <TopBarLayout v-slots={{
                topBar: () => <TopBarContent/>,
                default: () => viewMode.value === "calendar" ? <PanelCalendar/> : <PanelTimeline/>
            }}/>
        </>
    }
})
