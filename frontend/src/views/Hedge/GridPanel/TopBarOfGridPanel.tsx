import { defineComponent, inject } from "vue"
import { panelInjection } from ".."
import TopBarViewController from "../MainPanel/TopBarViewController"

/**
 * 在Grid面板下的顶栏。
 * 内容比较简单，只包括一个返回按钮和view控制器。
 */
export default defineComponent({
    setup() {
        const panelMode = inject(panelInjection)

        return () => <nav class="level">
            <div class="level-left">
                <button class="no-drag button is-white is-small" onClick={() => panelMode.value = "main"}>
                    <span class="icon"><i class="fa fa-lg fa-angle-left"/></span>
                </button>
                <button class="no-drag button is-white is-small" onClick={() => panelMode.value = "detail"}>
                    <span class="icon"><i class="fa fa-lg fa-open"/></span>打开display页(UI TEST)
                </button>
            </div>
            <div class="level-right">
                <TopBarViewController/>
            </div>
        </nav>
    }
})