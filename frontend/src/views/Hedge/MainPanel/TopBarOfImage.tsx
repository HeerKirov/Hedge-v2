import { defineComponent, inject, Ref, ref } from "vue"
import { panelInjection } from ".."
import TopBarQueryBox from "./TopBarQueryBox"
import TopBarViewController from "./TopBarViewController"

type ImageBarMode = "image" | "import" | "album"

/**
 * 业务内容为image时，通用的顶栏业务内容。可内嵌在顶栏组件内使用。
 */
export default defineComponent({
    setup() {
        const barMode: Ref<ImageBarMode> = ref("image")
        const queryInCollection = ref(true)
        const panelMode = inject(panelInjection)

        const changeQueryInCollection = () => {
            queryInCollection.value = !queryInCollection.value
            panelMode.value = "grid"    //UI测试用
        }

        return () => <nav class="level">
            <div class="level-left">
                {barMode.value === "import" ? <p class="control mr-6">
                    <button class="button no-drag is-success is-small is-rounded">
                        <i class="fa fa-lg fa-file-import mr-2"/>导入文件
                    </button>
                </p> : null}
            </div>
            <div class="level-item">
                <div class="field is-grouped w-100 mx-6 pl-6">
                    {barMode.value === "image" && <p class="control mr-2">
                        <button class="button no-drag is-small rounded-50" onClick={changeQueryInCollection}>
                            <span class="icon"><i class={`fa fa-lg fa-${queryInCollection.value ? "images" : "file-image"}`}/></span>
                        </button>
                    </p>}
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
