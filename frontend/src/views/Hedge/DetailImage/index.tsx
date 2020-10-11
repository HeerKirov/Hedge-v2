import { defineComponent } from "vue"
import "./style.scss"

import img1 from "../../../assets/img1.jpg"

export default defineComponent({
    setup() {
        return () => <div class="v-detail-image">
            <div>
                <img src={img1}></img>
            </div>
        </div>
    }
})