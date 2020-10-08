import { defineComponent } from "vue"
import "./style.scss"

import img2 from "../../../assets/img2.jpg"

export default defineComponent({
    setup() {
        return () => <div class="v-display">
            <div>
                <img src={img2}></img>
            </div>
        </div>
    }
})