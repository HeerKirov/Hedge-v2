import { defineComponent, ref, watch } from "vue"
import { openExternal, useWebAccessUrls } from "@/functions/service"
import { useSettingWeb } from "@/functions/server-api/setting"
import CheckBox from "@/components/CheckBox"
import Input from "@/components/Input"
import style from "./style.module.scss"

export default defineComponent({
    setup() {
        const urls = useWebAccessUrls()
        const { loading, data } = useSettingWeb()

        const onClickLink = (url: string) => () => openExternal(url)

        const passwordSwitch = ref(false)
        const passwordBox = ref<string>("")
        const savePassword = () => {
            if(passwordBox.value) {
                data.value!.password = passwordBox.value
            }else{
                data.value!.password = null
            }
        }
        const switchPassword = () => {
            if(passwordSwitch.value) {
                data.value!.password = null
            }else{
                passwordSwitch.value = true
            }
        }
        watch(data, v => {
            if(v) {
                passwordBox.value = v.password ?? ""
                passwordSwitch.value = v.password != null
            }
        })

        return () => loading.value ? <div/> : <div class={style.root}>
            {data.value!.access ? <div class="block is-success">
                <p class="is-size-6"><i class="fa fa-network-wired mr-1"/>局域网Web访问: 已开启</p>
                <p class="mt-3 mb-1">在浏览器访问以下地址以使用Hedge的Web服务:</p>
                {urls.value.map(url => <p class="is-family-code is-size-7"><i class="fa fa-circle mr-2"/><a onClick={onClickLink(url)}>{url}</a></p>)}
                <button class="button mt-4 is-success is-light" onClick={() => data.value!.access = false}><i class="fa fa-times mr-1"/>关闭Web访问</button>
            </div> : <div class="block">
                <p class="is-size-6"><i class="fa fa-network-wired mr-1"/>局域网Web访问: 已关闭</p>
                <p class="mt-3 mb-1">局域网Web访问服务允许通过浏览器，在本机或同一局域网上的其他电脑使用Hedge。</p>
                <button class="button mt-2 is-white" onClick={() => data.value!.access = true}><i class="fa fa-door-open mr-1"/>启动Web访问</button>
            </div>}
            <p class="mt-3 mb-3">Web访问服务选项</p>
            <label class="checkbox">
                <CheckBox value={data.value!.password != null} onUpdateValue={switchPassword}/>通过Web访问需要密码
            </label>
            <p class="is-size-8 has-text-grey">如果处于不能完全信任的局域网环境，打开独立密码以阻止无授权的访问。</p>
            {passwordSwitch.value && <div class="group">
                <Input type="password" class="is-small" value={passwordBox.value} onUpdateValue={v => passwordBox.value = v}/>
                <button class="square button is-info is-small" onClick={savePassword}><span class="icon"><i class="fa fa-save"/></span></button>
            </div>}
            <label class="checkbox mt-2">
                <CheckBox value={data.value?.autoWebAccess} onUpdateValue={v => data.value!.autoWebAccess = v}/>自动启动Web访问服务
            </label>
            <p class="is-size-8 has-text-grey">登录App后自动开启Web访问服务。</p>
            <label class="checkbox mt-2">
                <CheckBox value={data.value?.permanent} onUpdateValue={v => data.value!.permanent = v}/>维持Web访问服务在后台运行
            </label>
            <p class="is-size-8 has-text-grey">开启Web访问服务后，即使关闭App，也使访问服务在后台可用。开启这项功能会维持核心服务的持续运行。</p>
        </div>
    }
})