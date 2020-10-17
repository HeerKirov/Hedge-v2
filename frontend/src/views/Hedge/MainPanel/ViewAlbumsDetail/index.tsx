import { defineComponent } from "vue"
import TopBar from "../../TopBar"
import TopBarContent from "./TopBarContent"
import ImageGrid from "../../../../layouts/ImageGrid"
import { arrays } from "../../../../utils/collections"
import "./style.scss"

import img1 from "../../../../assets/img1.local.jpg"
import img2 from "../../../../assets/img2.local.jpg"

export default defineComponent({
    setup() {
        const images = [
            img2, img2, img1, img2, img1, img2, img1, img2, img1, img2
        ]

        return () => <div id="hedge-albums-detail">
            <ImageGrid items={images}>
                {{
                    fixedHeader: () => <div class="h-title-bar"/>,
                    header: () => <div class="m-1">
                        <p class="is-size-7">这是一段描述。</p>
                        <div class="mt-1">
                            {arrays.newArray(4, () => <i class="fa fa-star mr-1"/>)}
                        </div>
                        <div class="mt-1">
                            {arrays.newArray(30, i => <span class="tag is-light is-success mr-1">标签 {i}</span>)}
                        </div>
                    </div>
                }}
            </ImageGrid>
            <TopBar>
                {() => <TopBarContent/>}
            </TopBar>
        </div>
    }
})