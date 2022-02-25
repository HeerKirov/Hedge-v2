import { defineComponent } from "vue"
import { ViewStack, installViewStack } from "@/layouts/view-stacks"
import { GlobalDialog, installDialogService } from "@/layouts/globals/GlobalDialog"
import { installMetaTagCallout, MetaTagCallout } from "@/layouts/globals/MetaTagCallout"
import { installSideBarLayout } from "@/components/layouts/SideLayout"
import { useRouterParamEvent } from "@/services/global/router"

export default defineComponent({
    setup() {
        const viewStack = installViewStack()
        installDialogService()
        installMetaTagCallout()
        installSideBarLayout()

        useRouterParamEvent("Preview", params => {
            if(params.type === "image") {
                viewStack.openImageView(params.imageIds, params.currentIndex ?? 0, undefined, true)
            }else if(params.type === "collection") {
                viewStack.openCollectionView(params.collectionId, undefined, true)
            }else if(params.type === "album") {
                viewStack.openAlbumView(params.albumId, undefined, true)
            }
        })

        return () => <>
            <ViewStack/>
            <GlobalDialog/>
            <MetaTagCallout/>
        </>
    }
})
