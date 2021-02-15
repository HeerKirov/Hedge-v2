import { defineComponent } from "vue"
import DetailImage from "@/layouts/ImageDetail"

import img1 from "@/assets/img1.local.jpg"

/**
 * detail panel的内容。
 */
export default defineComponent({
    setup() {
        return () => <div id="panel">
            <DetailImage src={img1}/>
        </div>
    }
})