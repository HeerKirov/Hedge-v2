import { defineComponent } from "vue"
import { interceptGlobalKey } from "@/functions/feature/keyboard"
import { useViewStack } from "./index"

export const BackspaceButton = defineComponent({
    setup() {
        const { closeView, isClosable } = useViewStack()

        interceptGlobalKey(["Escape", "Backspace"], closeView)

        return () => isClosable() && <button class="button square is-white no-drag" onClick={closeView}>
            <span class="icon">
                <i class="fa fa-arrow-left"/>
            </span>
        </button>
    }
})
