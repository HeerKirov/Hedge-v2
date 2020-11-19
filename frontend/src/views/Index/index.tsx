import { defineComponent, onMounted, PropType, Ref, ref } from "vue"
import { useRouter } from "vue-router"
import { useAppState, useAppResource, useAppServer } from "@/functions/service"

export default defineComponent({
    setup() {
        const router = useRouter()
        const appState = useAppState()
        const appResource = useAppResource()
        const appServer = useAppServer()

        const loading: Ref<LoadingType | undefined> = ref()

        onMounted(async () => {
            console.log("/index onMounted")
            if(appState.status.value === "NOT_INIT") {
                console.log("appdata is not_init")
                //如果处于未初始化的状态，直接跳转到init
                router.push({name: "Init"})
                return
            }
            if(appResource.main.needUpdate) {
                console.log("/index resource need update")
                //如果资源需要升级，那么异步等待其升级
                loading.value = "resource"
                await appResource.main.update()
                loading.value = "loading"
            }
            if(appState.status.value !== "LOGIN") {
                console.log("/index app is not login")
                //如果处于未登录的状态，跳转到login
                router.push({name: "Login"})
                return
            }
            if(!appServer.status.value) {
                console.log("/index server is not starting")
                //如果server未启动，那么异步启动server
                loading.value = "starting"
                await appServer.connect()
                loading.value = "loading"
            }
            //以上流程结束 & 条件满足后，跳转到hedge
            router.push({name: "HedgeIndex"})
        })

        return () => <div id="index">
            {loading.value && <Loading type={loading.value}/>}
        </div>
    }
})

type LoadingType = "loading" | "resource" | "starting"

const loadingMessage = {
    "loading": "",
    "resource": "正在更新资源……",
    "starting": "正在启动服务……"
}

const Loading = defineComponent({
    props: {
        type: {type: null as any as PropType<LoadingType>, required: true}
    },
    setup(props) {
        return () => <div class="fixed center has-text-centered">
            <span class="icon"><i class="fa fa-3x fa-code-branch"/></span>
            <p class="mt-4">{loadingMessage[props.type]}</p>
        </div>
    }
})