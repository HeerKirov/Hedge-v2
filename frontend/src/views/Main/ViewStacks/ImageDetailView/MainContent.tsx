import { defineComponent, provide, ref } from "vue"
import Dashboard, { dashboardZoomInjection } from "@/layouts/data/Dashboard"
import TopBarLayout from "@/layouts/layouts/TopBarLayout"
import { assetsUrl } from "@/functions/app"
import TopBarContent from "./TopBarContent"
import { useDetailViewContext } from "./inject"

export default defineComponent({
    setup() {
        const { detail } = useDetailViewContext()

        provide(dashboardZoomInjection, {zoom: ref(20)})

        const topBarLayoutSlots = {
            topBar() { return <TopBarContent/> },
            default() {
                return detail.target.value && <Dashboard src={assetsUrl(detail.target.value.file)}/>
            }
        }
        return () => <TopBarLayout v-slots={topBarLayoutSlots}/>
    }
})
