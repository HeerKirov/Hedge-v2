import { defineComponent } from "vue"
import { useRoute, useRouter } from "vue-router"

export default defineComponent({
    setup() {
        const route = useRoute()
        const router = useRouter()

        const goHome = () => router.push({name: "Index"})

        return () => <>
            <div class="title-bar"/>
            <div class="block is-danger fixed center is-size-medium">
                <b class="is-size-4">未知的URL</b>
                <p class="mt-1"><b>{route.fullPath}</b>不是程序可识别的URL。请回到正确的地址。</p>
                <button class="mt-2 button is-danger is-light" onClick={goHome}>返回主页</button>
            </div>
        </>
    }
})