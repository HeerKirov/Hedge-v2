import { defineComponent, provide, ref } from "vue"
import SideDrawer from "@/layouts/layouts/SideDrawer"
import Dashboard, { dashboardZoomInjection } from "@/layouts/data/Dashboard"
import TopBarCollapseLayout from "@/layouts/layouts/TopBarCollapseLayout"
import { assetsUrl } from "@/functions/app"
import { usePopupMenu } from "@/functions/module/popup-menu"
import TopBarContent from "./TopBarContent"
import MetaTagPanel from "./SideDrawer/MetaTagPanel"
import SourcePanel from "./SideDrawer/SourcePanel"
import { useDetailViewContext } from "./inject"

export default defineComponent({
    setup() {
        const { detail, ui: { drawerTab } } = useDetailViewContext()

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

        const closeDrawerTab = () => {
            drawerTab.value = undefined
        }

        const topBarLayoutSlots = {
            topBar() { return <TopBarContent/> },
            default() {
                return detail.target.value && <Dashboard src={assetsUrl(detail.target.value.file)} onContextmenu={() => menu.popup()}/>
            }
        }
        return () => <>
            <TopBarCollapseLayout v-slots={topBarLayoutSlots}/>
            <SideDrawer tab={drawerTab.value} onClose={closeDrawerTab} v-slots={{
                "metaTag": () => <MetaTagPanel/>,
                "source": () => <SourcePanel/>
            }}/>
        </>
    }
})
