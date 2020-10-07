import { defineComponent } from "vue"

/**
 * 图片列表底部悬浮显示的提示栏。主要提供的功能：
 * - 选中任意图片时，显示选中提示。
 * - 点击这个提示，弹出右键菜单。
 */
export default defineComponent({
    setup() {
        return () => <div>
            <div class="px-4 opacity-80 tag is-dark">
                <b>已选中8个项目，共16张图片</b>
                {/*根据选项类型，智能给出项目&图片的提示*/}
            </div>
        </div>
    }
})