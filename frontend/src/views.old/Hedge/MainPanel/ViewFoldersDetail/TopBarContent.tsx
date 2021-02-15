import { defineComponent, inject, Ref, ref } from "vue"
import TopBarViewController from "../../TopBar/ViewController"

/**
 * 画集的顶栏。
 */
export default defineComponent({
    setup() {
        return () => <div class="h-middle-layout absolute stretch">
            <div class="left">
                <button class="button is-small is-white mr-2"><span class="icon"><i class="fa fa-lg fa-angle-left"/></span></button>
                <b>这是文件夹名称</b>
            </div>
            <div class="middle">
                <button class="button is-small is-white has-text-grey absolute horizontal-center">
                    <span class="icon mr-2"><i class="fa fa-lg fa-folder-minus"/></span>这是虚拟文件夹的查询条件
                </button>
            </div>
            <div class="right">
                <p class="control mr-2">
                    <b class="is-size-7 line-height-24">80/1024项</b>
                </p>
                <TopBarViewController/>
            </div>
        </div>
    }
})
