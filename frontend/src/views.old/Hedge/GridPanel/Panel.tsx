import { defineComponent } from "vue"
import ImageGrid from "@/layouts/ImageGrid"

// import img1 from "@/assets/img1.local.jpg"
// import img2 from "@/assets/img2.local.jpg"

/**
 * grid panel的内容。
 */
export default defineComponent({
    setup() {
        const images = []

        return () => <div id="panel">
            <ImageGrid marginTopBar={true} items={images}>
                
            </ImageGrid>
        </div>
    }
})