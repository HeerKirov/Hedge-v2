import { defineComponent, PropType } from "vue"
import { useRoute, useRouter } from "vue-router"

type Reason = "NOT_FOUND" | "FORBIDDEN_IN_WEB"

export default defineComponent({
    props: {
        reason: {type: null as any as PropType<Reason>, default: "NOT_FOUND"}
    },
    setup(props) {
        const route = useRoute()
        const router = useRouter()

        const goHome = () => router.push({name: "Index"})

        return () => <>
            <div class="title-bar"/>
            <div class="block is-danger fixed center is-size-medium">
                {props.reason === "NOT_FOUND" ? <>
                    <b class="is-size-4">未知的URL</b>
                    <p class="mt-1"><b>{route.fullPath}</b>不是程序可识别的URL。请回到正确的地址。</p>
                </> : <>
                    <b class="is-size-4">禁止访问</b>
                    <p class="mt-1"><b>{route.fullPath}</b>在web模式下的访问被禁止。</p>
                </>}
                <button class="mt-2 button is-danger is-light" onClick={goHome}>返回主页</button>
            </div>
        </>
    }
})