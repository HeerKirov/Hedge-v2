import { defineComponent, inject, Ref, ref } from "vue"
import { panelInjection } from "../.."
import MiddleLayout from "../../TopBar/MiddleLayout"
import QueryBox from "../../TopBar/QueryBox"
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

        return () => <MiddleLayout>
            {{
                default: () => <div class="field is-grouped">
                    <p class="control mr-2">
                        <button class="button no-drag is-small rounded-50" onClick={changeQueryInCollection}>
                            <span class="icon"><i class={`fa fa-lg fa-${queryInCollection.value ? "images" : "file-image"}`}/></span>
                        </button>
                    </p>
                    <QueryBox placeholder="使用hedge QL查询"/>
                </div>,
                right: () => <>
                    <p class="control mr-2">
                        <b class="is-size-7 line-height-24">80/1024项</b>
                    </p>
                    <TopBarViewController/>
                </>
            }}
        </MiddleLayout>
    }
})
