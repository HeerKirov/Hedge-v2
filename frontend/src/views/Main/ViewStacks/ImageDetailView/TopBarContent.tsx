import { defineComponent } from "vue"
import { useViewStacks } from "../../ViewStacks"

export default defineComponent({
    setup() {
        const viewStacks = useViewStacks()

        return () => <div class="middle-layout">
            <div class="layout-container">
                <button class="square button is-white" onClick={viewStacks.goBack}><span class="icon"><i class="fa fa-arrow-left"/></span></button>
            </div>
            <div class="layout-container">

            </div>
            <div class="layout-container">

            </div>
        </div>
    }
})
