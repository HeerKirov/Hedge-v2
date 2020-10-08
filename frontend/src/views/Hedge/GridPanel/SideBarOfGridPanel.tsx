import { defineComponent } from "vue"

/**
 * Grid面板的侧边栏。主要展示collection/album的info。此外还有编辑入口。
 */
export default defineComponent({
    setup() {
        return () => <div class="v-side-bar-grid">
            <div><i class="fa fa-images mr-2"/><b>12</b></div>
            <h1 class="is-size-5">这一行是标题</h1>
            <p>这一行是描述</p>
            <div class="mt-4">
                <span class="tag is-light is-primary">标签</span>
            </div>
            <p class="mt-4 is-size-7">2020-10-01 16:00:00</p>
        </div>
    }
})