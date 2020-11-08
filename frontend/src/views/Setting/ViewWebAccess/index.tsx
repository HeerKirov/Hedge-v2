import { defineComponent } from "vue"
import Input from "@/components/Input"
import style from "./style.module.scss"

export default defineComponent({
    setup() {
        return () => <div class={style.root}>
            <div class="notification is-success">
                <p><i class="fa fa-network-wired mr-1"/>局域网Web访问: 已开启</p>
                <p class="is-size-7 mt-3 mb-1">在浏览器访问以下地址以使用Hedge的Web服务:</p>
                <p class="is-family-code is-size-7"><i class="fa fa-circle mr-2"/><a>http://this-pc:9090</a></p>
                <button class="button is-small mt-4 is-success is-light"><i class="fa fa-times mr-1"/>关闭Web访问</button>
            </div>
            <div class="notification">
                <p><i class="fa fa-network-wired mr-1"/>局域网Web访问: 已关闭</p>
                <p class="is-size-7 mt-3 mb-1">局域网Web访问服务允许通过浏览器，在本机或同一局域网上的其他电脑使用Hedge。</p>
                <button class="button is-small mt-2 is-white"><i class="fa fa-door-open mr-1"/>启动Web访问</button>
            </div>
            <p class="mb-3">Web访问服务选项</p>
            <div class="field">
                <label class="checkbox">
                    <input type="checkbox" class="mr-1"/>通过Web访问需要密码
                </label>
                <p class="is-size-7 has-text-grey">如果处于不能完全信任的局域网环境，打开独立密码以阻止无授权的访问。</p>
            </div>
            <div class="field has-addons">
                <p class="control">
                    <Input type="password" class="is-small"/>
                </p>
                <p class="control">
                    <button class="button is-info is-small"><i class="fa fa-save"/></button>
                </p>
            </div>
            <div class="field">
                <label class="checkbox">
                    <input type="checkbox" class="mr-1"/>自动启动Web访问服务
                </label>
                <p class="is-size-7 has-text-grey">登录App后自动开启Web访问服务。</p>
            </div>
            <div class="field">
                <label class="checkbox">
                    <input type="checkbox" class="mr-1"/>维持Web访问服务在后台运行
                </label>
                <p class="is-size-7 has-text-grey">开启Web访问服务后，即使关闭App，也使访问服务在后台可用。开启这项功能会维持核心服务的持续运行。</p>
            </div>
        </div>
    }
})