import { defineComponent } from "vue"
import { ColumnNumButton, DataRouter, FitTypeButton } from "@/layouts/topbars"
import { FitType } from "@/layouts/data/IllustGrid"
import { BackspaceButton } from ".."
import { usePreviewContext } from "./inject"

export default defineComponent({
    setup() {
        const { images: { viewController: { fitType, columnNum } } } = usePreviewContext()

        const setFitType = (v: FitType) => fitType.value = v
        const setColumnNum = (v: number) => columnNum.value = v

        return () => <div class="middle-layout">
            <div class="layout-container">
                <BackspaceButton/>
            </div>
            <div class="layout-container">
                <DataRouter/>
                <FitTypeButton value={fitType.value} onUpdateValue={setFitType}/>
                <ColumnNumButton value={columnNum.value} onUpdateValue={setColumnNum}/>
            </div>
        </div>
    }
})
