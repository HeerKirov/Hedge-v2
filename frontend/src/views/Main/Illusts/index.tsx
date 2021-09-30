import { defineComponent } from "vue"
import TopBarLayout from "@/layouts/layouts/TopBarLayout"
import { CreatingCollectionDialog, installCreatingCollectionDialog } from "@/layouts/dialogs/CreatingCollectionDialog"
import TopBarContent from "./TopBarContent"
import ListView from "./ListView"
import { installIllustContext } from "./inject"

export default defineComponent({
    setup() {
        installIllustContext()
        installCreatingCollectionDialog()

        const topBarLayoutSlots = {
            topBar: () => <TopBarContent/>,
            default: () => <ListView/>
        }
        return () => <>
            <TopBarLayout v-slots={topBarLayoutSlots}/>
            <CreatingCollectionDialog/>
        </>
    }
})
