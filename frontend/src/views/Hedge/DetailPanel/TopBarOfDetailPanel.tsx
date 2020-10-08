import { defineComponent, inject } from "vue"
import { panelInjection } from ".."
import TopBarViewController from "../TopBarViewController"

/**
 * 在详情面板下的顶栏。
 * 内容比较简单，只包括返回按钮、view控制器、功能按钮。
 */
export default defineComponent({
    setup() {
        const panelMode = inject(panelInjection)

        return () => <nav class="level">
            <div class="level-left">
                <button class="no-drag button is-white is-small" onClick={() => panelMode.value = "grid"}>
                    <span class="icon"><i class="fa fa-lg fa-angle-left"/></span>
                </button>
            </div>
            <div class="level-right">
                <p class="control mr-1">
                    <button class="button no-drag is-small">
                        <i class="fa fa-lg fa-external-link-alt"/>
                    </button>
                </p>
                <p class="control">
                    <button class="button no-drag is-small">
                        <i class="fa fa-lg fa-eye mr-2"/><b>X1</b>
                    </button>
                </p>
            </div>
        </nav>
    }
})