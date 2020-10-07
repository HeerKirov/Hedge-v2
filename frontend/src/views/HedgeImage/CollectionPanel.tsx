import { defineComponent } from "vue"
import ImageGrid from "./ImageGrid"

import img1 from "../../assets/img1.jpg"
import img2 from "../../assets/img2.jpg"
import img3 from "../../assets/img3.jpg"

/**
 * 项目内容的面板组件。用途是在按项目聚合的查询中，对项目的浏览指令，将打开此面板展示项目内容。
 * TODO 不对，按照各方面逻辑，项目内容面板应该做成一个预想中image那样的全局组件。把这个改一改。
 */
export default defineComponent({
    setup() {
        const images = [img1, img2, img3, img1, img2, img3, img1, img2, img3, img1, img2, img3]

        return () => <div class="v-collection-panel">
            <nav class="level">
                <div class="level-left">
                    <button class="button is-small"><span class="icon"><i class="fa fa-angle-left"/></span></button>
                </div>
                <div class="level-right">
                    <i class="fa fa-images mr-2"/><b>8</b>
                </div>
            </nav>
            <ImageGrid class="v-collection-grid" images={images}/>
        </div>
    }
})