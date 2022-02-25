import { defineComponent, ref, watch } from "vue"
import { useServerInfo } from "@/services/app"
import { useAuthSetting } from "@/services/app/app-settings"
import { usePropertySot } from "@/functions/utils/properties/setter-property"
import { useSettingService } from "@/services/api/setting"
import Input from "@/components/forms/Input"
import CheckBox from "@/components/forms/CheckBox"

export default defineComponent({
    setup() {
        const serverInfo = useServerInfo()
        const authSetting = useAuthSetting()
        const { data: settingService } = useSettingService()

        const [ portBox, portBoxSot, setPortBox, savePort ] = usePropertySot(ref(""),
            () => settingService.value?.port,
            newValue => {
                portType.value = validatePort(newValue || "")
                return newValue || ""
            },
            v => settingService.value!.port = v || null)

        const portType = ref<PortType>("AUTO")
        watch(portBox, (v, _, onInvalidate) => {
            let validate = true
            onInvalidate(() => validate = false)
            setTimeout(() => {
                if(validate) {
                    portType.value = validatePort(v)
                }
            }, 250)
        })

        return () => !serverInfo.value || !authSetting.value || !settingService.value ? <div/> : <div>
            {serverInfo.value.running ? <div class="block is-success is-light">
                <p class="is-size-6"><i class="fa fa-server mr-1"/>核心服务正在运行</p>
                <p class="is-size-7 mt-2">核心服务是一项独立的进程，在后台为整套Hedge应用提供功能服务，除App外，还包括Web访问服务和命令行工具。</p>
                <p class="is-size-7">Hedge会自己做好对核心服务的管理，通常不必关心这个进程。</p>
                <p class="is-size-7 mt-2">
                    <i class="fa fa-bullseye mr-2"/>PID<span class="is-family-code ml-1 mr-4">{serverInfo.value.pid}</span>
                    <i class="fa fa-ethernet mr-2"/>端口<span class="is-family-code ml-1">{serverInfo.value.port}</span>
                </p>
                <p class="is-size-7 mt-2">
                    <i class="fa fa-business-time mr-2"/>已运行时长<span class="is-family-code ml-1 mr-4">{serverInfo.value.runningTime}</span>
                </p>
            </div> : <div class="block is-danger">
                <p class="is-size-6"><i class="fa fa-server mr-1"/>核心服务异常</p>
                <p class="is-size-7 mt-2">核心服务未在运行。</p>
            </div>}
            <p class="mt-3 mb-3 is-size-medium">核心服务选项</p>
            <div class="block">
                <p>建议的端口</p>
                <div class="field mt-2">
                    <div class="group">
                        <Input class="is-small" placeholder="9000, 9090-9099" value={portBox.value} onUpdateValue={setPortBox} refreshOnInput={true}/>
                        {portBoxSot.value && <button class="square button is-info is-small" onClick={savePort}><i class="fa fa-save"/></button>}
                    </div>
                    {
                        portType.value === "AUTO" ? <p class="has-text-grey">由Hedge自动搜索可用的端口。</p> :
                        portType.value === "RANGE" ? <p class="has-text-grey">在指定的范围中搜索可用的端口。</p> :
                        portType.value === "ERROR" ? <p class="has-text-danger">无效的端口参数。请使用<code>,</code>和<code>-</code>等描述简单的端口或端口范围。</p> :
                        <p class="has-text-grey">使用端口<code>:{portType.value}</code>。</p>
                    }
                </div>
            </div>
            <div class="mt-4">
                <CheckBox value={authSetting.value!.fastboot} onUpdateValue={v => authSetting.value!.fastboot = v}>快速启动</CheckBox>
                <p class="is-size-7 has-text-grey">在登录通过之前就启动核心服务，以加快启动速度。</p>
            </div>
        </div>
    }
})

type PortType = "AUTO" | "RANGE" | number | "ERROR"

function validatePort(port: string): PortType {
    const trimPort = port.trim()
    if(trimPort === "") {
        return "AUTO"
    }

    if(/^[0-9]+$/.test(trimPort)) {
        return parseInt(trimPort)
    }

    const ports = trimPort.split(",").map(s => s.split("-")).flat(1)
    if(ports.filter(p => !/^[0-9]+$/.test(p)).length > 0) {
        return "ERROR"
    }
    return "RANGE"
}
