import { defineComponent } from "vue"
import "./style.scss"

import img1 from "../../assets/img1.jpg"

/**
 * 详情页的图片区域。
 */
export default defineComponent({
    setup() {
        return () => <div class="v-image-detail">
            <div>
                <img src={img1}></img>
            </div>
        </div>
    }
})
