import { defineComponent } from "vue"
import TopBarLayout from "@/layouts/layouts/TopBarLayout"
import SplitPane from "@/layouts/layouts/SplitPane"
import TopBarContent from "./TopBarContent"
import ListView from "./ListView"
import { installSourceImageContext } from "./inject"

export default defineComponent({
    setup() {
        const { pane: { detailMode } } = installSourceImageContext()

        return () => <div>
            <TopBarLayout v-slots={{
                topBar: () => <TopBarContent/>,
                default: () => <SplitPane v-slots={{
                    default: () => <ListView/>,
                    pane: () => undefined
                }}/>
            }}/>
        </div>
    }
})
