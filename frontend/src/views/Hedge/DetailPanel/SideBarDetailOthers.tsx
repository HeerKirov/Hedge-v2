import { defineComponent, ref } from "vue"

import img1 from "../../../assets/img1.local.jpg"

/**
 * 详情页面的侧边栏，显示相关项目的分栏。
 */
export default defineComponent({
    setup() {
        const score = ref(4)
        const images = [img1, img1, img1]

        //侧边栏信息采用即时编辑模式，点击某项直接编辑，失去焦点或点击确认即保存
        return () => <div class="v-side-bar-detail others">
            <p><a class="is-size-7 has-text-dark"><i class="fa fa-clone mr-2"/>《<b>画集A</b>》</a></p>
            <p class="mt-2"><a class="is-size-7 has-text-dark"><i class="fa fa-images mr-2"/><b>相关的图像</b> (19张)</a></p>
            <div class="collection-grid">
                {images.map(image => <div class="collection-grid-wide-2"><img src={image}/></div>)}
            </div>
            <p class="is-size-7">(以及剩余的15张)</p>
        </div>
    }
})