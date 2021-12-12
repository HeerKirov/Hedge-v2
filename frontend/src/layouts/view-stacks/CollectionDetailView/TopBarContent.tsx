import { computed, defineComponent } from "vue"
import { ColumnNumButton, DataRouter, FitTypeButton } from "@/layouts/topbars"
import { FitType } from "@/layouts/data/IllustGrid"
import { useElementPopupMenu } from "@/functions/module/popup-menu"
import { BackspaceButton } from "../index"
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
                <FavoriteButton/>
                <ExternalButton/>
                <DataRouter/>
                <FitTypeButton value={fitType.value} onUpdateValue={setFitType}/>
                <ColumnNumButton value={columnNum.value} onUpdateValue={setColumnNum}/>
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