import { defineComponent } from "vue"
import QueryBox from "../../TopBar/QueryBox"

export default defineComponent({
    setup() {
        return () => <div class="h-middle-layout absolute stretch">
            <div class="middle">
                <div class="field is-grouped">
                    <QueryBox class="mr-1" placeholder="使用hedge QL查询作者…" icon="user-tag"/>
                </div>
            </div>
            <div class="right">
                <p class="control mr-1">
                        <button class="button no-drag is-small">
                            <span class="icon"><i class="fa fa-plus"/></span>
                        </button>
                    </p>
            </div>
        </div>
    }
})