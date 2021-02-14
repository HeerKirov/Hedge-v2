import { defineComponent, inject, onMounted, ref } from "vue"
import { useRouter } from "vue-router"
import { useAppInfo, useAppResource, useAppServer, useAppState } from "@/functions/service"
import ProgressFlag from "@/components/ProgressFlag"
import { InitContextInjection } from "./inject"
import style from "./style.module.scss"

export default defineComponent({
    setup() {
        const router = useRouter()
        const appState = useAppState()
        const appResource = useAppResource()
        const appServer = useAppServer()
        const appInfo = useAppInfo()

        const context = inject(InitContextInjection)!

        const status = ref<"loading" | "data" | "resource" | "starting" | "server" | "finished">("loading")

        const next = () => { router.push({name: "HedgeIndex"}) }

        onMounted(async () => {
            if(appInfo.clientMode) {
                status.value = "data"
                const initializeAppOk = await appState.initializeApp(context.password.hasPassword ? context.password.value : null)
                if(!initializeAppOk) return

                status.value = "resource"
                await appResource.main.update()

                status.value = "starting"
                const connectOk = await appServer.connect()
                if(!connectOk) return

                status.value = "server"
                const initializeDatabaseOk = await appServer.initializeDatabase(context.db.custom ? context.db.customFolderPath : `${appInfo.userDataPath}/appdata/channel/${appInfo.channel}/database/${context.db.folderInAppData}`)
                if(!initializeDatabaseOk) return
            }else{
                console.error("Initialize can only be executed in client.")
            }

            status.value = "finished"
        })

        return () => status.value === "finished"? <>
            <h2 class="is-size-5 mb-2">完成</h2> 
            <div class="has-text-centered absolute center">
                <i class="fa fa-3x fa-check mb-4"/>
                <div>初始化已完成。点击继续开始使用。</div>
            </div>
            <div class={style.bottom}>
                <button class="button is-link absolute right-bottom" onClick={next}>继续<i class="fa fa-hand-peace ml-2"/></button>
            </div>
        </> : <div class="has-text-centered absolute center">
            <span class="icon"><i class="fa fa-3x fa-code-branch"/></span>
            <p class="mt-4">{loadingMessage[status.value]}</p>
            <ProgressFlag class="mt-2"/>
        </div>
    }
})

const loadingMessage = {
    "loading": "",
    "data": "正在构建数据……",
    "resource": "正在部署资源……",
    "starting": "正在启动服务……",
    "server": "正在构建数据库……"
}