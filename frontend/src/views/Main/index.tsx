import { defineComponent, ref, provide } from "vue"
import { installImportService } from "@/functions/api/install"
import { sideBarSwitchInjection, sideBarWidthInjection, DEFAULT_WIDTH } from "@/layouts/layouts/SideLayout"
import ViewStacks, { installViewStacks } from "./ViewStacks"
import RootView from "./RootView"
import { installSideBarContext } from "./inject"

export default defineComponent({
    setup() {
        installImportService()
        installSideBarContext()
        installViewStacks()

        provide(sideBarSwitchInjection, ref(true))
        provide(sideBarWidthInjection, ref(DEFAULT_WIDTH))

        return () => <>
            <RootView/>
            <ViewStacks/>
        </>
    }
})
