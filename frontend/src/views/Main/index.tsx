import { defineComponent, ref, provide } from "vue"
import { installImportService } from "@/functions/api/install"
import { sideBarSwitchInjection, sideBarWidthInjection, DEFAULT_WIDTH } from "@/layouts/layouts/SideLayout"
import { DialogService, installDialogServiceContext } from "@/layouts/dialogs"
import { MetaTagCallout, installMetaTagCallout } from "@/layouts/data/MetaTagCallout"
import { ViewStack, installViewStack } from "@/layouts/view-stacks"
import { installSideBarContext } from "./inject"
import RootView from "./RootView"

export default defineComponent({
    setup() {
        installImportService()
        installSideBarContext()
        installViewStack()
        installDialogServiceContext()
        installMetaTagCallout()

        provide(sideBarSwitchInjection, ref(true))
        provide(sideBarWidthInjection, ref(DEFAULT_WIDTH))

        return () => <>
            <RootView/>
            <ViewStack/>
            <DialogService/>
            <MetaTagCallout/>
        </>
    }
})
