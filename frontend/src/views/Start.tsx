import { defineComponent } from "vue"
import { RouterView } from "vue-router"

export default defineComponent({
    setup() {
        return () => <div class="v-start">
            <div class="title-bar has-text-centered">
                <span>HEDGE</span>
            </div>
            <RouterView/>
        </div>
    }
})