import { defineComponent } from "vue"
import TopBarLayout from "@/components/layouts/TopBarLayout"
import IllustList from "../Illusts"
import TopBarContent from "./TopBarContent"
import PanelCalendar from "./PanelCalendar"
import PanelTimeline from "./PanelTimeline"
import { installPartitionContext } from "./inject"

export default defineComponent({
    setup() {
        const { viewMode, detail } = installPartitionContext()

        return () => detail.value === null ? <TopBarLayout v-slots={{
            topBar: () => <TopBarContent/>,
            default: () => viewMode.value === "calendar" ? <PanelCalendar/> : <PanelTimeline/>
        }}/> : <IllustList partitionTime={detail.value} onPartitionClose={() => detail.value = null}/>
    }
})
