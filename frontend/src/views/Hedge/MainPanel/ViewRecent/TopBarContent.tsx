import { defineComponent, inject, Ref, ref } from "vue"
import { columnNumberInjection, fitTypeInjection, FitType } from "../../../../layouts/ImageGrid/Item"
import TopBarQueryBox from "../../TopBar/QueryBox"
import TopBarViewController from "../../TopBar/ViewController"

/**
 * 业务内容为image时，通用的顶栏业务内容。可内嵌在顶栏组件内使用。
 */
export default defineComponent({
    setup() {
        const columnNumber = inject(columnNumberInjection)
        const fitType = inject(fitTypeInjection)

        return () => <nav class="level">
            <div class="level-left">
                <p class="control ml-1 mr-6">
                    <button class="button no-drag is-success is-small is-rounded">
                        <i class="fa fa-lg fa-file-import mr-2"/>导入文件
                    </button>
                </p>
            </div>
            <div class="level-item">
                <div class="field is-grouped w-100 mx-6 pl-6">
                    <TopBarQueryBox/>
                </div>
            </div>
            <div class="level-right">
                <p class="control mr-2">
                    <b class="is-size-7 line-height-24">80/1024项</b>
                </p>
                <TopBarViewController expandMode={fitType.value === "cover"} onUpdateExpandMode={(v: boolean) => fitType.value = v ? "cover" : "contain"}/>
            </div>
        </nav>
    }
})
