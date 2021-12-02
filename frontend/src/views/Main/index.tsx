import { defineComponent, ref, provide } from "vue"
import { installImportService } from "@/functions/api/install"
import { sideBarSwitchInjection, sideBarWidthInjection, DEFAULT_WIDTH } from "@/layouts/layouts/SideLayout"
import { DialogService, installDialogServiceContext } from "@/layouts/dialogs"
import { ViewStack, installViewStack } from "./view-stacks"
import { installSideBarContext } from "./inject"
import RootView from "./RootView"

export default defineComponent({
    setup() {
        installImportService()
        installSideBarContext()
        installViewStack()
        installDialogServiceContext()

        provide(sideBarSwitchInjection, ref(true))
        provide(sideBarWidthInjection, ref(DEFAULT_WIDTH))

        return () => <>
            <RootView/>
            <ViewStack/>
            <DialogService/>
        </>
    }
})
