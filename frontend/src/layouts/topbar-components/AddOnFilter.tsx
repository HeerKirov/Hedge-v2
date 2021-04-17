import { defineComponent } from "vue"

export default defineComponent({
    setup() {
        return () => <div>
            <button class="square button radius-large is-white">
                <span class="icon"><i class="fa fa-filter"/></span>
            </button>
        </div>
    }
})