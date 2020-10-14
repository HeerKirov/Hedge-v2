import { defineComponent } from "vue"
import ImageGrid from "../../../layouts/ImageGrid"

import img1 from "../../../assets/img1.local.jpg"
import img2 from "../../../assets/img2.local.jpg"

/**
 * grid panel的内容。
 */
export default defineComponent({
    setup() {
        const images = [img1, img2, img1, img2]

        return () => <div class="v-grid-panel-content">
            <ImageGrid images={images}>
                {{header: () => <div class="h-title-bar"/>}}
            </ImageGrid>
        </div>
    }
})