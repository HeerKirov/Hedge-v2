import { computed, defineComponent } from "vue"
import { DataRouter } from "@/layouts/topbar-components"
import { useImportService } from "@/functions/background"
import style from "./style.module.scss"

export default defineComponent({
    setup() {
        return () => <div class={["middle-layout", style.topBarContent]}>
            <div class="layout-container">
                <AddButton/>
            </div>
            <div class="layout-container">
                <LoadingBox/>
            </div>
            <div class="layout-container">
                <ImportAndMessageBox/>
                <DataRouter/>
                <button class="square button no-drag radius-large is-white">
                    <span class="icon"><i class="fa fa-ellipsis-v"/></span>
                </button>
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

const ImportAndMessageBox = defineComponent({
    setup() {
        const { isProgressing, warningList, errorList } = useImportService()

        const warningCount = computed(() => warningList.length)

        const errorCount = computed(() => errorList.length)

        const enableImport = computed(() => !isProgressing.value)

        return () => <>
            {(warningCount.value && errorCount.value) ? <button class="button no-drag radius-large is-white">
                <i class="fa fa-info-circle has-text-danger"/><span class="mx-1">{warningCount.value}</span>
                <i class="fa fa-info-circle has-text-warning"/><span class="ml-1">{errorCount.value}</span>
            </button> : null}
            <button class="button no-drag radius-large is-white mr-1" disabled={!enableImport.value}>
                <span class="icon"><i class="fa fa-check"/></span>
                <span>导入</span>
            </button>
        </>
    }
})
