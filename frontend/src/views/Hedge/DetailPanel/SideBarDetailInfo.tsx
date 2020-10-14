import { defineComponent, ref } from "vue"
import { arrays } from "../../../functions/collections"

/**
 * 详情页面的侧边栏，显示图像信息的分栏。
 */
export default defineComponent({
    setup() {
        const score = ref(4)

        //侧边栏信息采用即时编辑模式，点击某项直接编辑，失去焦点或点击确认即保存
        return () => <div class="v-side-bar-detail info">
            <p class="is-size-7"><i class="fa fa-id-card mr-2"/><b class="can-select">43967</b></p>
            <h1 class="is-size-5">这一行是标题</h1>
            <p>这一行是描述</p>
            <div class="mt-4">
                {arrays.newArray(score.value, () => <i class="fa fa-star mr-1"/>)}
            </div>
            <div class="mt-4 mb-3">
                {arrays.newArray(35, i => <span class="tag is-light is-primary mr-1">标签 {i}</span>)}
            </div>
            <p class="mt-1 is-size-7"><a class="has-text-dark"><b>时间分区 2020-09-30</b></a></p>
            <p class="mt-1 is-size-7">排序时间 2020-10-01 01:06:00</p>
            <p class="mt-1 is-size-7">添加时间 2020-10-01 02:00:00</p>
            <p class="mt-1 is-size-7">上次修改 2020-10-01 18:00:00</p>
            {/*智能化显示时间。默认显示的是添加时间，当排序时间/上次修改与其不同时，才列出额外的项显示 */}
        </div>
    }
})