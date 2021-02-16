import { defineComponent, inject } from "vue"
import { InitContextInjection } from "./inject"
import style from "./style.module.scss"

export default defineComponent({
    setup() {
        const context = inject(InitContextInjection)!

        return () => <>
            <h2 class="is-size-4 mb-2">完成</h2>
            <p>必要的配置已选择。</p>
            <div class="block py-2 px-3 mt-2 mb-1">
                口令: {context.password.hasPassword ? "已使用口令" : "未使用口令"}
            </div>
            <div class="block py-2 px-3 mb-3">
                数据库: {context.db.custom ? <code>{context.db.customFolderPath}</code> : context.db.folderInAppData}
            </div>
            <p>接下来将:</p>
            <p>1. 初始化App数据文档和数据库。</p>
            <p>2. 部署App核心服务资源。这会稍微多花一点时间。</p>
            
            <div class={style.bottom}>
                <button class="button is-medium is-link is-light absolute left-bottom" onClick={context.page.prev}><span class="icon"><i class="fa fa-arrow-left"/></span><span>上一步</span></button>
                <button class="button is-medium is-link absolute right-bottom" onClick={context.page.next}><span>确认</span><span class="icon"><i class="fa fa-arrow-right"/></span></button>
            </div>
        </>
    }
})