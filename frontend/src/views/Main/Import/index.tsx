import { defineComponent } from "vue"
import TopBarLayout from "@/layouts/layouts/TopBarLayout"
import SplitPane from "@/layouts/layouts/SplitPane"
import TopBarContent from "./TopBarContent"
import ListView from "./ListView"
import LoadingBox from "./LoadingBox"

export default defineComponent({
    setup() {
        return () => <>
            <TopBarLayout v-slots={{
                topBar: () => <TopBarContent/>,
                default: () => <SplitPane showPane={false} v-slots={{
                    default: () => <ListView/>,
                    pane: () => undefined
                }}/>
            }}/>
            <LoadingBox/>
        </>
    }
})
