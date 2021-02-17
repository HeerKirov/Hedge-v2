import { defineComponent } from "vue"

export default defineComponent({
    setup() {
        //TODO code style
        return () => <div>
            <div class="block">
                <p class="is-size-6"><i class="fa fa-terminal mr-1"/>命令行工具: 已部署</p>
                <p class="mt-4">命令行工具是Hedge附带的一项工具应用程序，可以通过shell调用Hedge的相关功能，包括数据查询、项目导入、任务处理等。</p>
                <p class="mt-2">打开终端，使用命令<code>hedge</code>调用命令行工具。</p>
                <button class="button mt-4 is-white"><i class="fa fa-door-open mr-1"/>部署命令行工具</button>
            </div>
        </div>
    }
})