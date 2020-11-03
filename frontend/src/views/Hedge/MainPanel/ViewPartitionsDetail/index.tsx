import { defineComponent } from "vue"
import TopBar from "../../TopBar"
import TopBarContent from "./TopBarContent"
import ImageGrid from "../../../../layouts/ImageGrid"
import "./style.scss"

import img1 from "../../../../assets/img1.local.jpg"
import img2 from "../../../../assets/img2.local.jpg"

export default defineComponent({
    setup() {
        const images = [
            img1, img2, img1, img2, img1, img1, img2, img1, img2, img1
        ]

        return () => <div id="hedge-partitions-detail">
            <ImageGrid items={images} marginTopBar={true}/>
            <TopBar>
                {() => <TopBarContent/>}
            </TopBar>
        </div>
    }
})