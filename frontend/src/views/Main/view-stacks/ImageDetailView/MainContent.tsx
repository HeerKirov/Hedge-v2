import { defineComponent, provide, ref } from "vue"
import SideDrawer from "@/layouts/layouts/SideDrawer"
import Dashboard, { dashboardZoomInjection } from "@/layouts/data/Dashboard"
import TopBarCollapseLayout from "@/layouts/layouts/TopBarCollapseLayout"
import { assetsUrl } from "@/functions/app"
import { usePopupMenu } from "@/functions/module/popup-menu"
import { useMessageBox } from "@/functions/module/message-box"
import { useNavigator } from "@/functions/feature/navigator"
import TopBarContent from "./TopBarContent"
import MetaTagPanel from "./SideDrawer/MetaTagPanel"
import SourcePanel from "./SideDrawer/SourcePanel"
import { usePreviewContext } from "./inject"

export default defineComponent({
    setup() {
        const { detail, ui: { drawerTab } } = usePreviewContext()

        provide(dashboardZoomInjection, {zoom: ref(100), enable: ref(true)})

        const menu = useContextmenu()

        const closeDrawerTab = () => {
            drawerTab.value = undefined
        }

        const topBarLayoutSlots = {
            topBar() { return <TopBarContent/> },
            default() {
                return detail.target.value && <Dashboard src={assetsUrl(detail.target.value.file)} onContextmenu={() => menu.popup()}/>
            }
        }
        const sideDrawerSlots = {
            "metaTag"() { return <MetaTagPanel/> },
            "source"() { return <MetaTagPanel/> }
        }
        return () => <>
            <TopBarCollapseLayout v-slots={topBarLayoutSlots}/>
            <SideDrawer tab={drawerTab.value} onClose={closeDrawerTab} v-slots={sideDrawerSlots}/>
        </>
    }
})

function useContextmenu() {
    const navigator = useNavigator()
    const messageBox = useMessageBox()
    const { detail } = usePreviewContext()

    const openInNewWindow = () => {
        navigator.newWindow.preferences.image(detail.id.value!)
    }

    const del = async () => {
        if(await messageBox.showYesNoMessage("warn", "确定要删除此项吗？", "此操作不可撤回。")) {
            detail.deleteTarget()
        }
    }

    //TODO 完成image detail view右键菜单功能
    return usePopupMenu([
        {type: "normal", label: "在新窗口中打开", click: openInNewWindow},
        {type: "separator"},
        {type: "normal", label: "加入剪贴板"},
        {type: "separator"},
        {type: "normal", label: "添加到文件夹"},
        {type: "normal", label: "添加到\"X\""},
        {type: "normal", label: "添加到临时文件夹"},
        {type: "separator"},
        {type: "normal", label: "导出"},
        {type: "separator"},
        {type: "normal", label: "删除此项目", click: del}
    ])
}
