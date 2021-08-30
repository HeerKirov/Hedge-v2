import { defineComponent } from "vue"
import { interceptGlobalKey } from "@/functions/document/global-key"
import { useViewStacks } from "./inject"

export default defineComponent({
    setup() {
        const { goBack } = useViewStacks()

        interceptGlobalKey(["Escape", "Backspace"], goBack)

        return () => <button class="button square is-white no-drag" onClick={goBack}>
            <span class="icon">
                <i class="fa fa-arrow-left"/>
            </span>
        </button>
    }
})
