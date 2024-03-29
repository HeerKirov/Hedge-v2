import { defineComponent, inject } from "vue"
import { initContextInjection } from "./inject"
import style from "./style.module.scss"

export default defineComponent({
    setup() {
        const context = inject(initContextInjection)!

        return () => <>
            <h2 class="is-size-3 mb-2">欢迎使用Hedge!</h2>
            <p>此向导将引导您完成初始化。这只包括几个简单的步骤。</p>
            <div class={style.bottom}>
                <button class="button is-link is-medium" onClick={context.page.next}>开始</button>
            </div>
        </>
    }
})