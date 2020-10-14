import { defineComponent } from "vue"
import ImageGrid from "../../layouts/ImageGrid"
import "./style.scss"
import img1 from "../../assets/img1.jpg"
import img2 from "../../assets/img2.jpg"

export default defineComponent({
    setup() {
        const images = [
            img1, img2, img1, img2, img1, img2, img1, img2, img1, img2, img1, img2
        ]

        return () => <div class="v-hedge-image">
            <ImageGrid class="v-main-grid" images={images}/>
        </div>
    }
})