import { computed, defineComponent } from "vue"
import { DataRouter } from "@/layouts/topbar-components"
import { useImportService } from "@/functions/api/import"
import { useElementPopupMenu } from "@/functions/module"
import { useImportContext } from "./inject"
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
                <ImportButton/>
                <DataRouter/>
                <MenuButton/>
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
        const { operation: { canSave, save } } = useImportContext()

        const enableImport = computed(() => !isProgressing.value && canSave.value)

        return () => <button class="button no-drag radius-large is-white mr-1" disabled={!enableImport.value} onClick={save}>
            <span class="icon"><i class="fa fa-check"/></span>
            <span>导入</span>
        </button>
    }
})

const MenuButton = defineComponent({
    setup() {
        const { operation: { canSave, save } } = useImportContext()

        const menu = useElementPopupMenu(() => [
            {type: "normal", label: "导入", enabled: canSave.value, click: save},
            {type: "separator"},
            {type: "normal", label: "分析来源"},
            {type: "normal", label: "批量设定属性"}
        ], {position: "bottom", align: "left", offsetY: 4})

        return () => <button ref={menu.element} class="square button no-drag radius-large is-white" onClick={() => menu.popup()}>
            <span class="icon"><i class="fa fa-ellipsis-v"/></span>
        </button>
    }
})
