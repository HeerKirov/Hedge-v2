import { defineComponent, ref, watch } from "vue"
import MiddleLayout from "../../TopBar/MiddleLayout"
import QueryBox from "../../TopBar/QueryBox"

export default defineComponent({
    setup() {
        return () => <MiddleLayout>
            {{
                default: () => <QueryBox placeholder="查询主题…" icon="hashtag"/>,
                right: () => <p class="control mr-1">
                    
                </p>
            }}
        </MiddleLayout>
    }
})