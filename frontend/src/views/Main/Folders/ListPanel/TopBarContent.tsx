import { defineComponent } from "vue"
import { SearchBox } from "@/layouts/topbars"
import { useFolderContext } from "../inject"

export default defineComponent({
    setup() {
        const { list: { creator } } = useFolderContext()
        return () => <div class="middle-layout">
            <div class="layout-container">

            </div>
            <div class="layout-container">
                <SearchBox class="w-75 is-stretch-item"/>
            </div>
            <div class="layout-container">
                <button class="button square no-drag radius-large is-white" onClick={() => creator.openCreatorRow(null, null)}>
                    <i class="fa fa-plus"/>
                </button>
                <EditLockButton/>
            </div>
        </div>
    }
})

const EditLockButton = defineComponent({
    setup() {
        const { list: { editable } } = useFolderContext()
        const click = () => editable.value = !editable.value

        return () => <button class={`square button no-drag radius-large is-${editable.value ? "danger" : "white"}`} onClick={click}>
            <span class="icon"><i class={`fa fa-${editable.value ? "unlock" : "lock"}`}/></span>
        </button>
    }
})
