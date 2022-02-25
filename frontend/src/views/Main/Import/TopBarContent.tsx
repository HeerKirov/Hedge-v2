import { computed, defineComponent } from "vue"
import { useElementPopupMenu } from "@/services/module/popup-menu"
import { ColumnNumButton, DataRouter, FitTypeButton } from "@/layouts/topbars"
import { useImportService } from "@/services/api/import"
import { FitType } from "@/layouts/data/DatasetView"
import { useImportContext } from "./inject"
import style from "./style.module.scss"

export default defineComponent({
    setup() {
        const { listController: { fitType, columnNum, viewMode }, operation: { canSave, save }, pane } = useImportContext()

        const setFitType = (v: FitType) => fitType.value = v
        const setColumnNum = (v: number) => columnNum.value = v

        const menu = useElementPopupMenu(() => [
            {type: "checkbox", label: "显示信息预览", checked: pane.visible.value, click: () => pane.visible.value = !pane.visible.value},
            {type: "separator"},
            {type: "radio", checked: viewMode.value === "row", label: "列表模式", click: () => viewMode.value = "row"},
            {type: "radio", checked: viewMode.value === "grid", label: "网格模式", click: () => viewMode.value = "grid"},
            {type: "separator"},
            {type: "normal", label: "确认导入图库", enabled: canSave.value, click: save}
        ], {position: "bottom"})

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
                {viewMode.value === "grid" && <FitTypeButton value={fitType.value} onUpdateValue={setFitType}/>}
                {viewMode.value === "grid" && <ColumnNumButton value={columnNum.value} onUpdateValue={setColumnNum}/>}
                <button class="square button no-drag radius-large is-white" ref={menu.element} onClick={menu.popup}>
                    <span class="icon"><i class="fa fa-ellipsis-v"/></span>
                </button>
            </div>
        </div>
    }
})

const AddButton = defineComponent({
    setup() {
        const { openDialog } = useImportService()

        return () => <button class="button no-drag radius-large is-success" onClick={openDialog}>
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

        return () => dataView.data.value.metrics.total && dataView.data.value.metrics.total > 0 ?
            <button class="button no-drag radius-large is-white" disabled={!enableImport.value} onClick={save}>
                <span class="icon"><i class="fa fa-check"/></span>
                <span>确认导入</span>
            </button> : undefined
    }
})
