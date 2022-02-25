import { defineComponent, ref } from "vue"
import { useCliController } from "@/services/app"
import { clientPlatform } from "@/functions/adapter-ipc"

export default defineComponent({
    setup() {
        const cli = useCliController()

        return () => <div>
            {cli.status.value === "NOT_INIT" ? <NotInit onUpdate={cli.update}/> : cli.status.value === "UPDATING" ? <Updating/> : <Latest/>}
        </div>
    }
})

const NotInit = defineComponent({
    emits: ["update"],
    setup(_, { emit }) {
        const switchStatus = ref(false)

        return () => <div class="block">
            <p class="is-size-6"><i class="fa fa-terminal mr-1"/>命令行工具: 未部署</p>
            <p class="mt-4">命令行工具是Hedge附带的一项工具应用程序，可以通过shell调用Hedge的相关功能，包括数据查询、项目导入、任务处理等。</p>
            <p class="mt-2">尚未部署命令行工具。</p>
            {!switchStatus.value
                ? <button class="button mt-4 is-white" onClick={() => switchStatus.value = true}><i class="fa fa-door-open mr-1"/>部署命令行工具</button>
                : <>
                    <label class="label mt-2">部署须知</label>
                    <ul class="ml-4">
                        <li>CLI工具依赖<code>python 3.9</code>或以上版本，并使用<code>virtualenv</code>建立虚拟环境。在开始部署前，确保这两项可用。</li>
                        <li>CLI工具会被安装到<code>{clientPlatform === "darwin" ? "~/Library/Application Support/Hedge-v2/cli" : clientPlatform === "linux" ? "~/.config/Hedge-v2/cli" : "(不支持的平台)"}</code>位置。</li>
                        <li>将自动尝试在<code>~/.zshrc</code>, <code>~/.bashrc</code>或<code>~/.profile</code>文件下插入指向安装位置的PATH。若这些位置不可用，需要自行建立PATH。</li>
                    </ul>
                    <button class="button mt-2 is-white" onClick={() => emit("update")}><i class="fa fa-door-open mr-1"/>开始部署</button>
                </>
            }
        </div>
    }
})

const Updating = defineComponent({
    setup() {
        return () => <div class="block is-light is-warning">
            <p class="is-size-6"><i class="fa fa-terminal mr-1"/>命令行工具: 正在部署</p>
            <p class="mt-4">命令行工具是Hedge附带的一项工具应用程序，可以通过shell调用Hedge的相关功能，包括数据查询、项目导入、任务处理等。</p>
            <p class="mt-2">正在部署命令行工具……</p>
        </div>
    }
})

const Latest = defineComponent({
    setup() {
        return () => <div class="block is-light is-info">
            <p class="is-size-6"><i class="fa fa-terminal mr-1"/>命令行工具: 已部署</p>
            <p class="mt-4">命令行工具是Hedge附带的一项工具应用程序，可以通过shell调用Hedge的相关功能，包括数据查询、项目导入、任务处理等。</p>
            <p class="mt-2">打开终端，使用命令<code>hedge</code>调用命令行工具。</p>
        </div>
    }
})
