import { defineComponent } from "vue"
import TopBarLayout from "@/layouts/layouts/TopBarLayout"
import TopBarContent from "./TopBarContent"
import ListView from "./ListView"
import DetailDialog from "./DetailDialog"

export default defineComponent({
    setup() {
        return () => <div>
            <TopBarLayout v-slots={{
                topBar: () => <TopBarContent/>,
                default: () => <ListView/>
            }}/>
            <DetailDialog/>
        </div>
    }
})
