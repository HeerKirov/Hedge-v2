import { defineComponent, inject, ref } from "vue"
import { panelInjection } from "../.."
import QueryBox from "../../TopBar/QueryBox"

/**
 * 主页的顶栏内容。可内嵌在顶栏组件内使用。
 */
export default defineComponent({
    setup() {
        const queryInCollection = ref(true)
        const panelMode = inject(panelInjection)!

        const changeQueryInCollection = () => {
            queryInCollection.value = !queryInCollection.value
            panelMode.value = "grid"    //UI测试用
        }

        return () => <div class="h-middle-layout absolute stretch">
            <div class="middle">
                <div class="field is-grouped">
                    <p class="control mr-2">
                        <button class="button no-drag is-small rounded-50" onClick={changeQueryInCollection}>
                            <span class="icon"><i class={`fa fa-lg fa-${queryInCollection.value ? "images" : "file-image"}`}/></span>
                        </button>
                    </p>
                    <QueryBox placeholder="使用hedge QL查询"/>
                </div>
            </div>
        </div>
    }
})
