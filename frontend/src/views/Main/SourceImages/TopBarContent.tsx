import { defineComponent } from "vue"
import { DataRouter, SearchBox } from "@/layouts/topbars"
import { useElementPopupMenu } from "@/functions/module/popup-menu"
import { useSourceImageContext } from "./inject"

export default defineComponent({
    setup() {
        const {} = useSourceImageContext()
        return () => <div class="middle-layout">
            <div class="layout-container">

            </div>
            <div class="layout-container">
                <SearchBox class="w-75 is-stretch-item"/>
            </div>
            <div class="layout-container">
                <DataRouter/>
                <MenuButton/>
            </div>
        </div>
    }
})

const MenuButton = defineComponent({
    setup() {

        const menu = useElementPopupMenu(() => [
            {type: "normal", label: "新建来源数据项"},
            {type: "normal", label: "批量新建来源数据项"},
            {type: "normal", label: "导入来源数据"},
        ], {position: "bottom", align: "left", offsetY: 4})

        return () => <button ref={menu.element} class="square button no-drag radius-large is-white" onClick={() => menu.popup()}>
            <span class="icon"><i class="fa fa-ellipsis-v"/></span>
        </button>
    }
})
