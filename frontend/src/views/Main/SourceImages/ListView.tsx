import { defineComponent } from "vue"
import { useMessageBox } from "@/functions/module/message-box"
import { usePopupMenu } from "@/functions/module/popup-menu"
import { useFastObjectEndpoint } from "@/functions/utils/endpoints/object-fast-endpoint"
import { VirtualRow } from "@/components/features/VirtualScrollView"

export default defineComponent({
    setup() {
        return () => <div class="w-100 h-100">

        </div>
    }
})
