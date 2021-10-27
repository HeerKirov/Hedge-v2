import { defineComponent } from "vue"
import TopBarLayout from "@/layouts/layouts/TopBarLayout"
import { CreatingAlbumDialog, installCreatingAlbumDialog } from "@/layouts/dialogs/CreatingAlbumDialog"
import TopBarContent from "./TopBarContent"
import ListView from "./ListView"
import { installAlbumContext } from "./inject"

export default defineComponent({
    setup() {
        installAlbumContext()
        installCreatingAlbumDialog()

        const topBarLayoutSlots = {
            topBar: () => <TopBarContent/>,
            default: () => <ListView/>
        }
        return () => <>
            <TopBarLayout v-slots={topBarLayoutSlots}/>
            <CreatingAlbumDialog/>
        </>
    }
})
