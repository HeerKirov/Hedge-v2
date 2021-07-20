import { defineComponent, provide, ref } from "vue"
import Dashboard, { dashboardZoomInjection } from "@/layouts/data/Dashboard"
import TopBarCollapseLayout from "@/layouts/layouts/TopBarCollapseLayout"
import { assetsUrl, usePopupMenu } from "@/functions/app"
import TopBarContent from "./TopBarContent"
import { useDetailViewContext } from "./inject"

export default defineComponent({
    setup() {
        const { detail } = useDetailViewContext()

        provide(dashboardZoomInjection, {zoom: ref(100), enable: ref(true)})

        const menu = usePopupMenu([
            {type: "normal", label: "在新窗口中打开"},
            {type: "separator"},
            {type: "normal", label: "加入剪贴板"},
            {type: "separator"},
            {type: "normal", label: "添加到文件夹"},
            {type: "normal", label: "添加到\"X\""},
            {type: "normal", label: "添加到临时文件夹"},
            {type: "separator"},
            {type: "normal", label: "导出"},
            {type: "separator"},
            {type: "normal", label: "删除此项目"}
        ])

        const topBarLayoutSlots = {
            topBar() { return <TopBarContent/> },
            default() {
                return detail.target.value && <Dashboard src={assetsUrl(detail.target.value.file)} onContextmenu={() => menu.popup()}/>
            }
        }
        return () => <TopBarCollapseLayout v-slots={topBarLayoutSlots}/>
    }
})
