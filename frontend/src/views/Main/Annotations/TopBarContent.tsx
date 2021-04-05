import { defineComponent, inject } from "vue"
import Input from "@/components/Input"
import { DataRouter, AddOnFilter } from "@/layouts/TopBarComponents"
import { annotationContextInjection } from "./inject"

export default defineComponent({
    setup() {
        const { openCreatePane } = inject(annotationContextInjection)!

        return () => <div class="middle-layout">
            <div class="layout-container">你好</div>
            <div class="layout-container">
                <Input class="no-drag w-75 is-shrink-item"/>
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