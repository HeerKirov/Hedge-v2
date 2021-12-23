import { defineComponent } from "vue"
import TopBarLayout from "@/layouts/layouts/TopBarLayout"
import SplitPane from "@/layouts/layouts/SplitPane"
import { installSettingSite } from "@/functions/api/setting"
import TopBarContent from "./TopBarContent"
import ListView from "./ListView"
import PaneDetailView from "./PaneDetailView"
import { installImportContext } from "./inject"

export default defineComponent({
    setup() {
        const { pane: { paneEnabled } } = installImportContext()
        installSettingSite()

        return () => <TopBarLayout v-slots={{
            topBar: () => <TopBarContent/>,
            default: () => <SplitPane showPane={paneEnabled.value} v-slots={{
                default: () => <ListView/>,
                pane: () => <PaneDetailView/>
            }}/>
        }}/>
    }
})
