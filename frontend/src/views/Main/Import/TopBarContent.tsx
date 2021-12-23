import { computed, defineComponent } from "vue"
import { ColumnNumButton, DataRouter, FitTypeButton } from "@/layouts/topbars"
import { useImportService } from "@/functions/api/import"
import { FitType } from "@/layouts/data/IllustGrid"
import { useImportContext } from "./inject"
import style from "./style.module.scss"

export default defineComponent({
    setup() {
        const { viewController: { fitType, columnNum } } = useImportContext()

        const setFitType = (v: FitType) => fitType.value = v
        const setColumnNum = (v: number) => columnNum.value = v

        return () => <div class={["middle-layout", style.topBarContent]}>
            <div class="layout-container">
                <AddButton/>
            </div>
            <div class="layout-container">
                <LoadingBox/>
            </div>
            <div class="layout-container">
                <ImportButton/>
                <DataRouter/>
                <FitTypeButton value={fitType.value} onUpdateValue={setFitType}/>
                <ColumnNumButton value={columnNum.value} onUpdateValue={setColumnNum}/>
            </div>
        </div>
    }
})

const AddButton = defineComponent({
    setup() {
        const { openDialog } = useImportService()

        return () => <button class="button no-drag radius-large is-success ml-1" onClick={openDialog}>
            <span class="icon"><i class="fa fa-plus"/></span>
            <span>添加项目</span>
        </button>
    }
})

const LoadingBox = defineComponent({
    setup() {
        const { progress, isProgressing } = useImportService()
        return () => isProgressing.value ? <div class={style.loadingBox}>
            <p>{progress.value}/{progress.max}</p>
            <progress class="progress is-info is-small" value={progress.value} max={progress.max}/>
        </div> : undefined
    }
})

const ImportButton = defineComponent({
    setup() {
        const { isProgressing } = useImportService()
        const { operation: { canSave, save }, list: { dataView } } = useImportContext()

        const enableImport = computed(() => !isProgressing.value && canSave.value)

        return () => dataView.data.value.metrics.total && dataView.data.value.metrics.total > 0 &&
            <button class="button no-drag radius-large is-info mr-1" disabled={!enableImport.value} onClick={save}>
                <span class="icon"><i class="fa fa-check"/></span>
                <span>确认导入图库</span>
            </button>
    }
})
