import { defineComponent } from "vue"
import Input from "@/components/Input"

export default defineComponent({
    setup() {
        return () => <div>
            <div class="block is-success is-light">
                <p class="is-size-6"><i class="fa fa-server mr-1"/>核心服务正在运行</p>
                <p class="is-size-7 mt-2">核心服务是一项独立的进程，在后台为整套Hedge应用提供功能服务，除App外，还包括Web访问服务和命令行工具。</p>
                <p class="is-size-7">绝大多数情况下，Hedge会自己做好对核心服务的管理。</p>
                <p class="is-size-7 mt-2">
                    <i class="fa fa-bullseye mr-2"/>PID<span class="is-family-code ml-1 mr-4">19876</span>
                    <i class="fa fa-ethernet mr-2"/>端口<span class="is-family-code ml-1">9000</span>
                </p>
                <p class="is-size-7 mt-2">
                    <i class="fa fa-business-time mr-2"/>已运行时长<span class="is-family-code ml-1 mr-4">1:06:00</span>
                </p>
            </div>
            <div class="block is-danger">
                <p class="is-size-6"><i class="fa fa-server mr-1"/>核心服务异常</p>
                <p class="is-size-7 mt-2">核心服务未在运行，且没有报告任何错误信息。</p>
                <button class="button is-small mt-2 is-light is-danger"><i class="fa fa-door-open mr-1"/>尝试重启核心服务</button>
            </div>
            <p class="mt-3 mb-3">核心服务选项</p>
            <div class="block">
                <p>建议的端口</p>
                <div class="field mt-2">
                    <div class="group">
                        <Input class="v-port-box is-small" placeholder="9000, 9090-9099"/>
                        <button class="square button is-info is-small"><i class="fa fa-save"/></button>
                    </div>
                    <p class="has-text-grey">由Hedge自动搜索可用的端口。</p>
                    <p class="has-text-grey">使用端口<code>:9000</code>。</p>
                    <p class="has-text-grey">在指定的范围中搜索可用的端口。</p>
                    <p class="has-text-danger">无效的端口参数。请使用<code>,</code>和<code>-</code>等描述简单的端口或端口范围。</p>
                </div>
            </div>
            <div class="mt-4">
                <label class="checkbox">
                    <input type="checkbox"/>快速启动
                </label>
                <p class="is-size-7 has-text-grey">在登录通过之前就启动核心服务，以加快启动速度。</p>
            </div>
        </div>
    }
})