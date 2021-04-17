import { defineComponent } from "vue"
import Input from "@/components/forms/Input"
import { DataRouter, AddOnFilter } from "@/layouts/topbar-components"
import { useAnnotationContext } from "./inject"

export default defineComponent({
    setup() {
        const { openCreatePane } = useAnnotationContext()

        return () => <div class="middle-layout">
            <div class="layout-container">你好</div>
            <div class="layout-container is-shrink-item">
                <Input class="no-drag w-75"/>
                <AddOnFilter class="ml-1 no-drag"/>
            </div>
            <div class="layout-container">
                <DataRouter/>
                <button class="square button no-drag radius-large is-white" onClick={() => openCreatePane()}>
                    <span class="icon"><i class="fa fa-plus"/></span>
                </button>
            </div>
        </div>
    }
})
