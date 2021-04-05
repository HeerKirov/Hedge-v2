import { defineComponent, provide } from "vue"
import TopBarLayout from "@/layouts/TopBarLayout"
import SplitPane from "@/layouts/SplitPane"
import TopBarContent from "./TopBarContent"
import ListView from "./ListView"
import PaneDetailView from "./PaneDetailView"
import PaneCreateView from "./PaneCreateView"
import { annotationContextInjection, useAnnotationContextInjection } from "./inject"


export default defineComponent({
    setup() {
        const context = useAnnotationContextInjection()

        provide(annotationContextInjection, context)

        const { createMode, detailMode } = context

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