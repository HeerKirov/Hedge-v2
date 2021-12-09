import { defineComponent, provide, ref } from "vue"
import { ViewStack, installViewStack } from "@/layouts/view-stacks"
import { installDialogServiceContext } from "@/layouts/dialogs"
import { DEFAULT_WIDTH, sideBarSwitchInjection, sideBarWidthInjection } from "@/layouts/layouts/SideLayout"
import { useRouterParamEvent } from "@/functions/feature/router"

export default defineComponent({
    setup() {
        const viewStack = installViewStack()
        installDialogServiceContext()

        provide(sideBarSwitchInjection, ref(true))
        provide(sideBarWidthInjection, ref(DEFAULT_WIDTH))

        useRouterParamEvent("Preview", params => {
            if(params.type === "image") {
                viewStack.openImageView(params.imageIds, params.currentIndex ?? 0, undefined, true)
            }else if(params.type === "collection") {
                viewStack.openCollectionView(params.collectionId, undefined, true)
            }else if(params.type === "album") {
                viewStack.openAlbumView(params.albumId, undefined, true)
            }
        })

        return () => <ViewStack/>
    }
})
