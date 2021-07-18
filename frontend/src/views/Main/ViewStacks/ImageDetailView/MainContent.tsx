import { defineComponent, provide, ref } from "vue"
import Dashboard, { dashboardZoomInjection } from "@/layouts/data/Dashboard"
import TopBarCollapseLayout from "@/layouts/layouts/TopBarCollapseLayout"
import { assetsUrl } from "@/functions/app"
import TopBarContent from "./TopBarContent"
import { useDetailViewContext } from "./inject"

export default defineComponent({
    setup() {
        const { detail } = useDetailViewContext()

        provide(dashboardZoomInjection, {zoom: ref(100)})

        const topBarLayoutSlots = {
            topBar() { return <TopBarContent/> },
            default() {
                return detail.target.value && <Dashboard src={assetsUrl(detail.target.value.file)}/>
            }
        }
        return () => <TopBarCollapseLayout v-slots={topBarLayoutSlots}/>
    }
})
