import { defineComponent } from "vue"
import TopBarLayout from "@/components/layouts/TopBarLayout"
import SplitPane from "@/components/layouts/SplitPane"
import { installSettingSite } from "@/services/api/setting"
import TopBarContent from "./TopBarContent"
import ListView from "./ListView"
import PaneDetailView from "./PaneDetailView"
import { installImportContext } from "./inject"

export default defineComponent({
    setup() {
        const { pane } = installImportContext()
        installSettingSite()

        return () => <TopBarLayout v-slots={{
            topBar: () => <TopBarContent/>,
            default: () => <SplitPane showPane={pane.visible.value} v-slots={{
                default: () => <ListView/>,
                pane: () => <PaneDetailView/>
            }}/>
        }}/>
    }
})
