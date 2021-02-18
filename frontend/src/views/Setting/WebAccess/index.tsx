import { defineComponent } from "vue"
import Input from "@/components/Input"
import style from "./style.module.scss"

export default defineComponent({
    setup() {
        return () => <div class={style.root}>
            <div class="block is-success">
                <p class="is-size-6"><i class="fa fa-network-wired mr-1"/>局域网Web访问: 已开启</p>
                <p class="mt-3 mb-1">在浏览器访问以下地址以使用Hedge的Web服务:</p>
                <p class="is-family-code is-size-7"><i class="fa fa-circle mr-2"/><a>http://this-pc:9090</a></p>
                <button class="button mt-4 is-success is-light"><i class="fa fa-times mr-1"/>关闭Web访问</button>
            </div>
            <div class="block">
                <p class="is-size-6"><i class="fa fa-network-wired mr-1"/>局域网Web访问: 已关闭</p>
                <p class="mt-3 mb-1">局域网Web访问服务允许通过浏览器，在本机或同一局域网上的其他电脑使用Hedge。</p>
                <button class="button mt-2 is-white"><i class="fa fa-door-open mr-1"/>启动Web访问</button>
            </div>
            <p class="mt-3 mb-3">Web访问服务选项</p>
            <label class="checkbox">
                <input type="checkbox"/>通过Web访问需要密码
            </label>
            <p class="is-size-8 has-text-grey">如果处于不能完全信任的局域网环境，打开独立密码以阻止无授权的访问。</p>
            <div class="group">
                <Input type="password" class="is-small"/>
                <button class="square button is-info is-small"><span class="icon"><i class="fa fa-save"/></span></button>
            </div>
            <label class="checkbox">
                <input type="checkbox"/>自动启动Web访问服务
            </label>
            <p class="is-size-8 has-text-grey">登录App后自动开启Web访问服务。</p>
            <label class="checkbox mt-2">
                <input type="checkbox"/>维持Web访问服务在后台运行
            </label>
            <p class="is-size-8 has-text-grey">开启Web访问服务后，即使关闭App，也使访问服务在后台可用。开启这项功能会维持核心服务的持续运行。</p>
        </div>
    }
})