import { defineComponent, inject } from "vue"
import Input from "@/components/Input"
import { DataRouter } from "@/layouts/TopBarComponents"
import { annotationContextInjection } from "./inject"

export default defineComponent({
    setup() {
        const { detail } = inject(annotationContextInjection)!

        const newButton = () => { detail.value = "NEW" }

        return () => <div class="middle-layout">
            <div class="middle single-line-group">
                <Input class="no-drag fullwidth"/>
            </div>
            <div class="middle-right single-line-group">
            </div>
            <div class="right single-line-group">
                <DataRouter/>
                <button class="square button no-drag radius-large is-white" onClick={newButton}><span class="icon"><i class="fa fa-plus"/></span></button>
            </div>
        </div>
    }
})