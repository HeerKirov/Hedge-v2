import { defineComponent } from "vue"
import { RouterLink, useRoute } from "vue-router"

export default defineComponent({
    setup() {
        const route = useRoute()

        return () => <div id="not-found" class="notification is-danger fixed center">
            <b class="is-size-5">未知的URL</b>
            <p><b>{route.fullPath}</b>不是程序所定义的URL。请回到正确的地址。</p>
            <RouterLink to={{name: "Index"}}>返回主页</RouterLink>
        </div>
    }
})