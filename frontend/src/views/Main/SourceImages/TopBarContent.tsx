import { defineComponent } from "vue"
import { DataRouter } from "@/layouts/topbars"
import { QueryBox, QueryNotifyBadge } from "@/layouts/topbars/Query"
import { useEditSourceImageService } from "@/layouts/dialogs/EditSourceImage"
import { useSourceImageContext } from "./inject"

export default defineComponent({
    setup() {
        const { querySchema } = useSourceImageContext()
        return () => <div class="middle-layout">
            <div class="layout-container">

            </div>
            <div class="layout-container">
                <QueryBox class="w-75 is-stretch-item"
                          value={querySchema.searchBoxText.value} onUpdateValue={v => querySchema.searchBoxText.value = v}
                          expanded={querySchema.expanded.value} onUpdateExpanded={v => querySchema.expanded.value = v}/>
                <QueryNotifyBadge class="ml-1" schema={querySchema.schema.value} onClick={() => querySchema.expanded.value = true}/>
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
        const { openCreateDialog } = useEditSourceImageService()

        const click = () => {
            openCreateDialog(() => endpoint.refresh())
        }

        return () => <button class="square button no-drag radius-large is-white" onClick={click}>
            <span class="icon"><i class="fa fa-plus"/></span>
        </button>
    }
})
