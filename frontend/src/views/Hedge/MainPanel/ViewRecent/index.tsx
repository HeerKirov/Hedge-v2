import { defineComponent } from "vue"
import ImageGrid from "../../../../layouts/ImageGrid"
import TopBar from "../../TopBar"
import "./style.scss"
import img1 from "../../../../assets/img1.local.jpg"
import img2 from "../../../../assets/img2.local.jpg"

export default defineComponent({
    setup() {
        const images = [
            img1, img2, img1, img2, img1, img2, img1, img2, img1, img2, img1, img2
        ]

        return () => <div class="v-hedge-recent">
            <ImageGrid class="v-main-grid" images={images}/>
            <TopBar>

            </TopBar>
        </div>
    }
})