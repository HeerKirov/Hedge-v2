import { defineComponent, provide } from "vue"
import TopBarLayout from "@/layouts/TopBarLayout"
import TopBarContent from "./TopBarContent"
import PanelListView from "./PanelListView"
import { annotationContextInjection, useAnnotationContextInjection } from "./inject"


export default defineComponent({
    setup() {
        const context = useAnnotationContextInjection()

        provide(annotationContextInjection, context)

        return () => <div>
            <TopBarLayout v-slots={{
                topBar: () => <TopBarContent/>,
                default: () => <PanelListView/>
            }}/>
        </div>
    }
})