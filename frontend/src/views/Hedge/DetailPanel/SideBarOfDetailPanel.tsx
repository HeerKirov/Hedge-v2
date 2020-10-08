import { defineComponent } from "vue"

export default defineComponent({
    setup() {
        return () => <div class="v-side-bar-detail">
            <p class="is-size-7"><i class="fa fa-id-card mr-2"/><b>43967</b></p>
            <h1 class="is-size-5">这一行是标题</h1>
            <p>这一行是描述</p>
            <div class="mt-4"><i class="fa fa-star"/></div>
            <div class="mt-4">
                <span class="tag is-light is-primary">标签</span>
            </div>
            <p class="mt-4 is-size-7">2020-10-01 16:00:00</p>
        </div>
    }
})