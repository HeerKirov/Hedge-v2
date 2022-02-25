import { defineComponent } from "vue"
import { installSideBarLayout } from "@/components/layouts/SideLayout"
import { installImportService } from "@/services/api/import"
import { GlobalDialog, installDialogService } from "@/layouts/globals/GlobalDialog"
import { MetaTagCallout, installMetaTagCallout } from "@/layouts/globals/MetaTagCallout"
import { ViewStack, installViewStack } from "@/layouts/view-stacks"
import { installSideBarContext } from "./inject"
import RootView from "./RootView"

export default defineComponent({
    setup() {
        installSideBarContext()
        installImportService()
        installViewStack()
        installMetaTagCallout()
        installDialogService()
        installSideBarLayout()

        return () => <>
            <RootView/>
            <ViewStack/>
            <GlobalDialog/>
            <MetaTagCallout/>
        </>
    }
})
