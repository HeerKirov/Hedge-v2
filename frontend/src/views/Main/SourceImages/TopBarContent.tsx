import { defineComponent } from "vue"
import { DataRouter, SearchBox } from "@/layouts/topbars"
import { useSourceImageEditDialog } from "@/layouts/dialogs/SourceImageEditDialog"
import { useSourceImageContext } from "./inject"

export default defineComponent({
    setup() {
        const {} = useSourceImageContext()
        return () => <div class="middle-layout">
            <div class="layout-container">

            </div>
            <div class="layout-container">
                <SearchBox class="w-75 is-stretch-item"/>
            </div>
            <div class="layout-container">
                <DataRouter/>
                <AddButton/>
            </div>
        </div>
    }
})

const AddButton = defineComponent({
    setup() {
        const { list: { endpoint } } = useSourceImageContext()
        const { openCreateDialog } = useSourceImageEditDialog()

        const click = () => {
            openCreateDialog(() => endpoint.refresh())
        }

        return () => <button class="square button no-drag radius-large is-white" onClick={click}>
            <span class="icon"><i class="fa fa-ellipsis-v"/></span>
        </button>
    }
})
