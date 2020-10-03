import { defineComponent } from "vue"
import { RouterView } from "vue-router"

export default defineComponent({
    setup() {
        return () => <div class="v-start">
            <div class="title-bar has-text-centered">
                <span>HEDGE</span>
            </div>
            <div class="v-content">
                <RouterView/>
            </div>
            <div class="v-bottom-bar">

            </div>
        </div>
    }
})