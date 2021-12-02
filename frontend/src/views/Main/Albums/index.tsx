import { defineComponent } from "vue"
import TopBarLayout from "@/layouts/layouts/TopBarLayout"
import TopBarContent from "./TopBarContent"
import ListView from "./ListView"
import { installAlbumContext } from "./inject"

export default defineComponent({
    setup() {
        installAlbumContext()

        const topBarLayoutSlots = {
            topBar: () => <TopBarContent/>,
            default: () => <ListView/>
        }
        return () => <TopBarLayout v-slots={topBarLayoutSlots}/>
    }
})
