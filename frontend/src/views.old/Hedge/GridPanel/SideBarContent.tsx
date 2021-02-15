import { defineComponent, ref } from "vue"
import { arrays } from "@/utils/collections"

/**
 * Grid面板的侧边栏。主要展示collection/album的info。此外还有编辑入口。
 */
export default defineComponent({
    setup() {
        const score = ref(4)
        
        return () => <div id="side-bar-grid">
            <div><i class="fa fa-images mr-2"/><b>12项</b></div>
            <h1 class="is-size-5">这一行是标题</h1>
            <p>这一行是描述</p>
            <div class="mt-4">
                {arrays.newArray(score.value, () => <i class="fa fa-star mr-1"/>)}
            </div>
            <div class="mt-4 mb-3">
                {arrays.newArray(15, i => <span class="tag is-info is-primary mr-1">标签 {i}</span>)}
            </div>
            <p class="mt-1 is-size-7">时间分区 2020-09-30</p>
            <p class="mt-1 is-size-7">排序时间 2020-10-01 01:06:00</p>
            <p class="mt-1 is-size-7">创建时间 2020-10-01 02:00:00</p>
            <p class="mt-1 is-size-7">上次更新 2020-10-01 18:00:00</p>
            {/*智能化显示时间。默认显示的是添加时间，当排序时间/上次更新与其不同时，才列出额外的项显示 */}
        </div>
    }
})