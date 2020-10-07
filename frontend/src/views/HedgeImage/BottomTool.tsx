import { defineComponent, Transition } from "vue"

/**
 * 图片列表底部悬浮显示的工具栏。主要提供的功能：
 * - 选中任意图片时，显示图片操作工具栏。
 * - 栈(剪贴板)里有图片时，显示一个工具球，提示栈内图片数量，并可以点击工具球进一步操作。
 */
export default defineComponent({
    setup() {
        return () => <div class="v-bottom-tool">
            <Transition name="v-bottom-tool">
                {() => <button class="button is-link v-clipboard-button">
                    <span class="icon is-size-6"><i class="fa fa-clipboard mr-1"/>8</span>
                </button>}
            </Transition>
            <Transition name="v-bottom-tool">
                {() => <div>
                    
                </div>}
            </Transition>
        </div>
    }
})