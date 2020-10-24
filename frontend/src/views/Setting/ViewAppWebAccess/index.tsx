import { defineComponent } from "vue"
import Input from "../../../components/Input"
import "./style.scss"

export default defineComponent({
    setup() {
        return () => <div id="setting-app-webaccess">
            <div class="notification is-success">
                <p><i class="fa fa-network-wired mr-1"/>局域网Web访问: 已开启</p>
                <p class="is-size-7 mt-3 mb-1">在浏览器访问以下地址以使用Hedge的Web服务:</p>
                <p class="is-family-code is-size-7"><i class="fa fa-circle mr-2"/><a>http://this-pc:9090</a></p>
                <button class="button is-small mt-4 is-success is-light"><i class="fa fa-times mr-1"/>关闭Web访问</button>
            </div>
            <div class="notification">
                <p><i class="fa fa-network-wired mr-1"/>局域网Web访问: 已关闭</p>
                <p class="is-size-7 mt-3 mb-1">局域网Web访问服务允许通过浏览器，在本机或同一局域网上的其他电脑使用Hedge。</p>
                <div class="field mt-2">
                    <Input class="v-port-box is-small" placeholder="9000, 9090-9099"/>
                    <p class="is-size-7 has-text-grey">由Hedge自动搜索可用的端口。</p>
                    <p class="is-size-7 has-text-grey">使用端口<code>:9000</code>。</p>
                    <p class="is-size-7 has-text-grey">在指定的范围中搜索可用的端口。</p>
                    <p class="is-size-7 has-text-danger">无效的端口参数。请使用<code>,</code>和<code>-</code>等描述简单的端口或端口范围。</p>
                </div>
                <button class="button is-small mt-2 is-white"><i class="fa fa-door-open mr-1"/>启动Web访问</button>
            </div>
            <p class="mb-3">Web访问服务选项</p>
            <div class="field">
                <label class="checkbox">
                    <input type="checkbox" class="mr-1"/>通过Web访问需要密码
                </label>
                <p class="is-size-7 has-text-grey">如果处于不能完全信任的局域网环境，打开密码以阻止无授权的访问。</p>
            </div>
            <div class="field">
                <label class="checkbox">
                    <input type="checkbox" class="mr-1"/>使用独立密码访问
                </label>
                <p class="is-size-7 has-text-grey">使用与登录密码不同的独立密码访问Web。登录密码仍然可用。</p>
            </div>
            <div class="field has-addons">
                <p class="control">
                    <Input type="password" class="v-password-box is-small"/>
                </p>
                <p class="control">
                    <button class="button is-info is-small"><i class="fa fa-save"/></button>
                </p>
            </div>
            <div class="field">
                <label class="checkbox">
                    <input type="checkbox" class="mr-1"/>登录后自动启动Web访问服务
                </label>
            </div>
        </div>
    }
})