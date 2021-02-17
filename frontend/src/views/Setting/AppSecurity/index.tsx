import { defineComponent } from "vue"

export default defineComponent({
    setup() {
        //TODO tag
        //TODO checkbox
        return () => <div>
            <p class="mb-1">安全选项</p>
            <div>
                <span class="tag is-light is-success"><span class="mr-1"><i class="fa fa-key"/></span>已设置登录口令</span>
                <a class="ml-1">修改口令</a>
            </div>
            <div>
                <input type="checkbox" class="mr-1"/>使用touch ID进行登录认证
                <p class="is-size-7 has-text-grey">您的mac支持touch ID。每次登录前首先尝试获得来自touch ID的授权。</p>
            </div>
        </div>
    }
})