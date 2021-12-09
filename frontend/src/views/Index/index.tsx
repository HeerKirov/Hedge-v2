import { defineComponent, watch } from "vue"
import { useRouter } from "vue-router"
import ProgressFlag from "@/components/elements/ProgressFlag"
import { State } from "@/functions/adapter-ipc"
import { useAppState } from "@/functions/app"
import { useNewWindowRouteReceiver } from "@/functions/feature/router"

export default defineComponent({
    setup() {
        const router = useRouter()
        const { state } = useAppState()
        const { receiveRoute } = useNewWindowRouteReceiver()

        watch(state, async () => {
            if(state.value === State.NOT_INIT) {
                //如果处于未初始化的状态，跳转到init
                await router.push({name: "Init"})
            }else if(state.value === State.NOT_LOGIN) {
                //如果处于未登录的状态，跳转到login
                await router.push({name: "Login"})
            }else if(state.value === State.LOADED) {
                //已经加载的状态，则首先查看是否存在route navigator参数
                const navigated = receiveRoute()
                //最后，默认跳转到main index首页
                if(!navigated) {
                    await router.push({name: "MainIndex"})
                }
            }
        }, {immediate: true})

        return () => <>
            <div class="title-bar line has-text-centered is-size-large"/>
            {state.value && <div class="fixed center has-text-centered">
                <i class="fa fa-3x fa-code-branch"/>
                <p class="mt-4 is-size-medium">{loadingMessage[state.value] ?? ""}</p>
                <ProgressFlag class="mt-2" showDelay={500}/>
            </div>}
        </>
    }
})

const loadingMessage = {
    [State.LOADING]: "",
    [State.LOADING_RESOURCE]: "正在更新资源……",
    [State.LOADING_SERVER]: "正在启动服务……"
}
