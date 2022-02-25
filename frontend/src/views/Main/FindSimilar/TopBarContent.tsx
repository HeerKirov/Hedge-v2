import { defineComponent } from "vue"
import { DataRouter } from "@/layouts/topbars"
import { useElementPopupMenu } from "@/services/module/popup-menu"

export default defineComponent({
    setup() {
        const menu = useElementPopupMenu(() => [
            {type: "normal", label: "创建扫描任务"}
        ], {position: "bottom"})

        return () => <div class="middle-layout">
            <div class="layout-container"/>
            <div class="layout-container">
                <DataRouter/>
                <button class="square button no-drag radius-large is-white" ref={menu.element} onClick={menu.popup}>
                    <span class="icon"><i class="fa fa-ellipsis-v"/></span>
                </button>
            </div>
        </div>
    }
})
