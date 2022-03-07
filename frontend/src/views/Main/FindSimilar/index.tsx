import { defineComponent } from "vue"
import TopBarLayout from "@/components/layouts/TopBarLayout"
import TopBarContent from "./TopBarContent"
import ListView from "./ListView"
import DetailDialog from "./DetailDialog"
import { installFindSimilarContext } from "./inject"

export default defineComponent({
    setup() {
        installFindSimilarContext()

        return () => <div>
            <TopBarLayout v-slots={{
                topBar: () => <TopBarContent/>,
                default: () => <ListView/>
            }}/>
            <DetailDialog/>
        </div>
    }
})
