import { defineComponent, ref, watch } from "vue"
import TopBarQueryBox from "../../TopBar/QueryBox"

export default defineComponent({
    setup() {
        return () => <nav class="level">
            <div class="level-item">
                <div class="field w-100 mx-6 pl-6 pr-6">
                    <TopBarQueryBox/>
                </div>
            </div>
            <div class="level-right">
                <p class="control mr-1">
                    
                </p>
            </div>
        </nav>
    }
})