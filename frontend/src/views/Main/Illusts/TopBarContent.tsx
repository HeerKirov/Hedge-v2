import { defineComponent } from "vue"
import { DataRouter, ColumnNumButton, FitTypeButton } from "@/layouts/topbar-components"
import { useElementPopupMenu } from "@/functions/module"
import { useIllustContext } from "./inject"

export default defineComponent({
    setup() {
        const { viewController: { fitType, columnNum }} = useIllustContext()

        return () => <div class="middle-layout">
            <div class="layout-container">

            </div>
            <div class="layout-container">

            </div>
            <div class="layout-container">
                <DataRouter/>
                <FitTypeButton value={fitType.value} onUpdateValue={v => fitType.value = v}/>
                <ColumnNumButton value={columnNum.value} onUpdateValue={v => columnNum.value = v}/>
                <MenuButton/>
            </div>
        </div>
    }
})

const MenuButton = defineComponent({
    setup() {
        const menu = useElementPopupMenu(() => [

        ], {position: "bottom", align: "left", offsetY: 4})

        return () => <button ref={menu.element} class="square button no-drag radius-large is-white" onClick={() => menu.popup()}>
            <span class="icon"><i class="fa fa-ellipsis-v"/></span>
        </button>
    }
})
