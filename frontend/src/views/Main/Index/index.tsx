import { defineComponent } from "vue"
import TopBarLayout from "@/layouts/layouts/TopBarLayout"

export default defineComponent({
    setup() {
        return () => <TopBarLayout v-slots={{
            default: () => <div class="w-100 h-100 has-text-centered">
                <i class="has-text-grey">首页施工中……</i>
            </div>
        }}/>
    }
})
