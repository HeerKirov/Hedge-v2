import { defineComponent, provide, ref } from "vue"
import ImageGrid from "../../../../layouts/ImageGrid"
import { columnNumberInjection, fitTypeInjection, FitType } from "../../../../layouts/ImageGrid/Item"
import TopBar from "../../TopBar"
import TopBarContent from "./TopBarContent"
import "./style.scss"

import img1 from "../../../../assets/img1.local.jpg"
import img2 from "../../../../assets/img2.local.jpg"

export default defineComponent({
    setup() {
        const images = [
            img1, img2, img1, img2, img1, img2, img1, img2, img1, img2, img1, img2
        ]

        const columnNumber = ref(6)
        const fitType = ref<FitType>("contain")

        provide(columnNumberInjection, columnNumber)
        provide(fitTypeInjection, fitType)

        return () => <div class="v-hedge-recent">
            <ImageGrid class="v-main-grid" images={images}>
                {{header: () => <div class="h-title-bar"/>}}
            </ImageGrid>
            <TopBar>
                {() => <TopBarContent/>}
            </TopBar>
        </div>
    }
})