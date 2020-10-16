import { defineComponent, inject, Ref, ref } from "vue"
import { panelInjection } from "../.."
import TopBarQueryBox from "../../TopBar/QueryBox"
import TopBarViewController from "../../TopBar/ViewController"

/**
 * 业务内容为image时，通用的顶栏业务内容。可内嵌在顶栏组件内使用。
 */
export default defineComponent({
    setup() {
        const queryInCollection = ref(true)
        const panelMode = inject(panelInjection)

        const changeQueryInCollection = () => {
            queryInCollection.value = !queryInCollection.value
            panelMode.value = "grid"    //UI测试用
        }

        return () => <nav class="level">
            <div class="level-left">
                <button class="button is-small is-white mr-2"><span class="icon"><i class="fa fa-lg fa-angle-left"/></span></button>
                <span>2020年10月</span>
            </div>
            <div class="level-item">
                <div class="field is-grouped w-100 mx-6 px-3">
                    <p class="control mr-2">
                        <button class="button no-drag is-small rounded-50" onClick={changeQueryInCollection}>
                            <span class="icon"><i class={`fa fa-lg fa-${queryInCollection.value ? "images" : "file-image"}`}/></span>
                        </button>
                    </p>
                    <TopBarQueryBox/>
                </div>
            </div>
            <div class="level-right">
                <p class="control mr-2">
                    <b class="is-size-7 line-height-24">80/1024项</b>
                </p>
                <TopBarViewController/>
            </div>
        </nav>
    }
})
