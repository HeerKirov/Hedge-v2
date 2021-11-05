import { defineComponent } from "vue"
import TopBarLayout from "@/layouts/layouts/TopBarLayout"
import SplitPane from "@/layouts/layouts/SplitPane"
import TopBarContent from "./TopBarContent"
import ListView from "./ListView"
import PaneDetailView from "./PaneDetailView"
import { useFolderContext } from "../inject"

export default defineComponent({
    setup() {
        const { pane: { detailMode } } = useFolderContext()

        return () => <TopBarLayout v-slots={{
            topBar: () => <TopBarContent/>,
            default: () => <SplitPane showPane={detailMode.value !== null} on v-slots={{
                pane: () => detailMode.value !== null ? <PaneDetailView/> : undefined,
                default: () => <ListView/>
            }}/>
        }}/>
    }
})
