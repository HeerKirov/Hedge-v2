import { defineComponent } from "vue"
import ImageCover from "./ImageCover"
import BottomTool from "./BottomTool"
import "./style.scss"
import img1 from "../../assets/img1.jpg"
import img2 from "../../assets/img2.jpg"
import img3 from "../../assets/img3.jpg"
import img4 from "../../assets/img4.jpg"
import img5 from "../../assets/img5.jpg"
import img6 from "../../assets/img6.jpg"
import img7 from "../../assets/img7.jpg"
import img8 from "../../assets/img8.png"
import img9 from "../../assets/img9.png"
import img10 from "../../assets/img10.png"
import img11 from "../../assets/img11.png"
import img12 from "../../assets/img12.jpg"
import img13 from "../../assets/img13.png"

export default defineComponent({
    setup() {
        const images = [
            img1, img2, img3, img4, img5,
            // img6, img7, img8, img9, img10,
            // img11, img12, img13
        ]

        return () => <div class="v-hedge-image">
            <div class="v-grid-content">
                {images.map(image => <ImageCover src={image} numTag={2} selected={image.endsWith(".png")}/>)}
            </div>
            <BottomTool/>
        </div>
    }
})