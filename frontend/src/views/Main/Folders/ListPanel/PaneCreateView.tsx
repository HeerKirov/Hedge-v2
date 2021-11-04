import { defineComponent } from "vue"
import { PaneBasicLayout } from "@/layouts/layouts/SplitPane"
import { useFolderContext } from "../inject"

export default defineComponent({
    setup() {
        const { pane } = useFolderContext()
        return () => <PaneBasicLayout onClose={pane.closePane}>

        </PaneBasicLayout>
    }
})
