import { computed, defineComponent } from "vue"
import { useElementPopupMenu } from "@/services/module/popup-menu"
import { FitType } from "@/layouts/data/DatasetView"
import { ColumnNumButton, DataRouter, FitTypeButton } from "@/layouts/topbars"
import { BackspaceButton } from "@/layouts/view-stacks"
import { usePreviewContext } from "./inject"

export default defineComponent({
    setup() {
        const { data: { target }, images: { viewController: { fitType, columnNum, viewMode }, pane } } = usePreviewContext()

        const setFitType = (v: FitType) => fitType.value = v
        const setColumnNum = (v: number) => columnNum.value = v

        const menu = useElementPopupMenu(() => [
            {type: "checkbox", label: "显示信息预览", checked: pane.visible.value, click: () => pane.visible.value = !pane.visible.value},
            {type: "separator"},
            {type: "radio", checked: viewMode.value === "row", label: "列表模式", click: () => viewMode.value = "row"},
            {type: "radio", checked: viewMode.value === "grid", label: "网格模式", click: () => viewMode.value = "grid"},
        ], {position: "bottom"})

        return () => <div class="middle-layout">
            <div class="layout-container">
                <BackspaceButton/>
                {target.value && <span class="ml-2 is-size-medium">{target.value.title}</span>}
            </div>
            <div class="layout-container">
                <FavoriteButton/>
                <ExternalButton/>
                <EditLockButton/>
                <DataRouter/>
                {viewMode.value === "grid" && <FitTypeButton value={fitType.value} onUpdateValue={setFitType}/>}
                {viewMode.value === "grid" && <ColumnNumButton value={columnNum.value} onUpdateValue={setColumnNum}/>}
                <button class="square button no-drag radius-large is-white mr-1" ref={menu.element} onClick={menu.popup}>
                    <span class="icon"><i class="fa fa-ellipsis-v"/></span>
                </button>
            </div>
        </div>
    }
})

const FavoriteButton = defineComponent({
    setup() {
        const { data: { target, setTargetData } } = usePreviewContext()

        const favorite = computed(() => target.value?.favorite ?? false)

        const click = () => setTargetData({ favorite: !favorite.value })

        return () => <button class="square button is-white no-drag" onClick={click}>
            <span class={`icon has-text-${favorite.value ? "danger" : "grey"}`}><i class="fa fa-heart"/></span>
        </button>
    }
})

const ExternalButton = defineComponent({
    setup() {
        const menu = useElementPopupMenu([
            {type: "normal", label: "在新窗口中打开"},
            {type: "separator"},
            {type: "normal", label: "批量导出"}
        ], {position: "bottom", offsetY: 6})

        return () => <button ref={menu.element} class="square button is-white no-drag" onClick={() => menu.popup()}><span class="icon"><i class="fa fa-external-link-alt"/></span></button>
    }
})

const EditLockButton = defineComponent({
    setup() {
        const { editable } = usePreviewContext().images.viewController
        const click = () => editable.value = !editable.value

        return () => <button class={`square button no-drag radius-large is-${editable.value ? "danger" : "white"}`} onClick={click}>
            <span class="icon"><i class={`fa fa-${editable.value ? "unlock" : "lock"}`}/></span>
        </button>
    }
})
