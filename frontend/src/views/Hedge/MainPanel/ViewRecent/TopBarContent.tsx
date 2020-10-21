import { defineComponent, inject, Ref, ref } from "vue"
import { columnNumberInjection, fitTypeInjection, FitType } from "../../../../layouts/ImageGrid/Item"
import MiddleLayout from "../../TopBar/MiddleLayout"
import TopBarViewController from "../../TopBar/ViewController"

/**
 * 业务内容为image时，通用的顶栏业务内容。可内嵌在顶栏组件内使用。
 */
export default defineComponent({
    setup() {
        const fitType = inject(fitTypeInjection)

        return () => <MiddleLayout>
            {{
                left: () => <p class="control ml-1 mr-6">
                    <button class="button no-drag is-success is-small is-rounded">
                        <i class="fa fa-lg fa-file-import mr-2"/>导入文件
                    </button>
                </p>,
                right: () => <TopBarViewController expandMode={fitType.value === "cover"} onUpdateExpandMode={(v: boolean) => fitType.value = v ? "cover" : "contain"}/>
            }}
        </MiddleLayout>
    }
})
