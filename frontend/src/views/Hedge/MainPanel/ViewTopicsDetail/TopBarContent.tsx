import { defineComponent, inject, Ref, ref } from "vue"
import MiddleLayout from "../../TopBar/MiddleLayout"

/**
 * 分区视图的顶栏。
 */
export default defineComponent({
    setup() {
        return () => <MiddleLayout>
            {{
                left: () => <button class="button is-small is-white mr-2"><span class="icon"><i class="fa fa-lg fa-angle-left"/></span></button>
            }}
        </MiddleLayout>
    }
})
