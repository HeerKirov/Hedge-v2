import { defineComponent, watch, watchEffect } from "vue"
import { useRouter } from "vue-router"
import { useAppState } from "@/functions/service"
import { State } from "@/functions/adapter-ipc"
import ProgressFlag from "@/components/ProgressFlag"

export default defineComponent({
    setup() {
        const router = useRouter()
        const { state } = useAppState()

        watch(state, async () => {
            if(state.value === State.NOT_INIT) {
                //如果处于未初始化的状态，跳转到init
                await router.push({name: "Init"})
            }else if(state.value === State.NOT_LOGIN) {
                //如果处于未登录的状态，跳转到login
                await router.push({name: "Login"})
            }else if(state.value === State.LOADED) {
                //否则跳转到main
                await router.push({name: "MainIndex"})
            }
        }, {immediate: true})

        return () => <div>
            {state.value && <div class="fixed center has-text-centered">
                <i class="fa fa-3x fa-code-branch"/>
                <p class="mt-4 is-size-medium">{loadingMessage[state.value] ?? ""}</p>
                <ProgressFlag class="mt-2" showDelay={500}/>
            </div>}
        </div>
    }
})

const loadingMessage = {
    [State.LOADING]: "",
    [State.LOADING_RESOURCE]: "正在更新资源……",
    [State.LOADING_SERVER]: "正在启动服务……"
}