import { defineComponent, inject } from "vue"
import MiddleLayout from "../TopBar/MiddleLayout"
import { panelInjection } from ".."

/**
 * 在详情面板下的顶栏。
 * 内容比较简单，只包括返回按钮、view控制器、功能按钮。
 */
export default defineComponent({
    setup() {
        const panelMode = inject(panelInjection)!

        return () => <MiddleLayout>
            {{
                left: () => <button class="no-drag button is-white is-small" onClick={() => panelMode.value = "grid"}>
                    <span class="icon"><i class="fa fa-lg fa-angle-left"/></span>
                </button>,
                right: () => <>
                    <p class="control mr-1">
                        <button class="button no-drag is-small">
                            <span class="icon"><i class="fa fa-heart has-text-danger"/></span>
                        </button>
                    </p>
                    <p class="control mr-1">
                        <button class="button no-drag is-small">
                            <span class="icon"><i class="fa fa-external-link-alt"/></span>
                        </button>
                    </p>
                    <p class="control mr-1">
                        <button class="button no-drag is-small">
                            <i class="fa fa-eye mr-2"/><b>X1</b>
                        </button>
                    </p>
                    <p class="control">
                        <button class="button no-drag is-small">
                            <span class="icon"><i class="fa fa-ellipsis-v"/></span>
                        </button>
                    </p>
                </>
            }}
        </MiddleLayout>
    }
})