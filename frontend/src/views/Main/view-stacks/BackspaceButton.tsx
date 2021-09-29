import { defineComponent } from "vue"
import { interceptGlobalKey } from "@/functions/feature/keyboard"
import { useViewStack } from "."

export const BackspaceButton = defineComponent({
    setup() {
        const { closeView } = useViewStack()

        interceptGlobalKey(["Escape", "Backspace"], closeView)

        return () => <button class="button square is-white no-drag" onClick={closeView}>
            <span class="icon">
                <i class="fa fa-arrow-left"/>
            </span>
        </button>
    }
})
