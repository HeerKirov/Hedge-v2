import { defineComponent, ref } from "vue"
import { arrays } from "../../../functions/collections"

/**
 * 详情页面的侧边栏，显示相关项目的分栏。
 */
export default defineComponent({
    setup() {
        const score = ref(4)

        //侧边栏信息采用即时编辑模式，点击某项直接编辑，失去焦点或点击确认即保存
        return () => <div class="v-side-bar-detail others">

        </div>
    }
})