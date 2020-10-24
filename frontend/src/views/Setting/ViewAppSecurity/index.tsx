import { defineComponent } from "vue"

export default defineComponent({
    setup() {
        return () => <div id="setting-app-security">
            <p class="mb-1">安全选项</p>
            <div class="field">
                <span class="tag is-light is-success"><i class="fa fa-key mr-1"/>已设置登录口令</span>
                <a class="is-size-7 ml-1">修改口令</a>
            </div>
            <div class="field">
                <label class="checkbox">
                    <input type="checkbox" class="mr-1"/>使用touch ID进行登录认证
                    <p class="is-size-7 has-text-grey">您的mac支持touch ID。每次登录前首先尝试获得来自touch ID的授权。</p>
                </label>
            </div>
            <p class="mb-1">登录杂项</p>
            <div class="field">
                <label class="checkbox">
                    <input type="checkbox" class="mr-1"/>登录后自动打开上一次使用的数据库
                </label>
            </div>
        </div>
    }
})