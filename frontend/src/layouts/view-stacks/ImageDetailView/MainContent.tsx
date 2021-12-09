import { defineComponent, ref } from "vue"
import SideDrawer from "@/layouts/layouts/SideDrawer"
import { installExpandedInfoStorage } from "@/layouts/data/TagTree"
import Dashboard, { installDashboardZoom } from "@/layouts/data/Dashboard"
import TopBarCollapseLayout from "@/layouts/layouts/TopBarCollapseLayout"
import MetaTagEditor from "@/layouts/drawers/MetaTagEditor"
import SourceEditor from "@/layouts/drawers/SourceEditor"
import { assetsUrl } from "@/functions/app"
import { usePopupMenu } from "@/functions/module/popup-menu"
import { useMessageBox } from "@/functions/module/message-box"
import { useRouterNavigator } from "@/functions/feature/router"
import TopBarContent from "./TopBarContent"
import { useMetadataEndpoint, useOriginDataEndpoint, usePreviewContext } from "./inject"

export default defineComponent({
    setup() {
        const { detail, ui: { drawerTab } } = usePreviewContext()

        installDashboardZoom(ref(true), ref(100))

        installExpandedInfoStorage()

        const menu = useContextmenu()

        const closeDrawerTab = () => drawerTab.value = undefined

        const topBarLayoutSlots = {
            topBar() { return <TopBarContent/> },
            default() {
                return detail.target.value && <Dashboard src={assetsUrl(detail.target.value.file)} onContextmenu={() => menu.popup()}/>
            }
        }
        const sideDrawerSlots = {
            "metaTag"() { return <MetaTagEditorPanel/> },
            "source"() { return <SourceEditorPanel/> }
        }
        return () => <>
            <TopBarCollapseLayout v-slots={topBarLayoutSlots}/>
            <SideDrawer tab={drawerTab.value} onClose={closeDrawerTab} v-slots={sideDrawerSlots}/>
        </>
    }
})

const MetaTagEditorPanel = defineComponent({
    setup() {
        const { ui: { drawerTab }, detail: { id } } = usePreviewContext()
        const { data, setData } = useMetadataEndpoint()

        const closeDrawerTab = () => drawerTab.value = undefined

        return () => <MetaTagEditor identity={id.value !== null ? {id: id.value!, type: "IMAGE"} : null}
                                    tags={data.value?.tags ?? []}
                                    topics={data.value?.topics ?? []}
                                    authors={data.value?.authors ?? []}
                                    tagme={data.value?.tagme ?? []}
                                    setData={setData} onClose={closeDrawerTab}/>
    }
})

const SourceEditorPanel = defineComponent({
    setup() {
        const { ui: { drawerTab } } = usePreviewContext()
        const { data, setData } = useOriginDataEndpoint()

        const closeDrawerTab = () => drawerTab.value = undefined

        return () => <SourceEditor data={data.value} setData={setData} onClose={closeDrawerTab}/>
    }
})

function useContextmenu() {
    const navigator = useRouterNavigator()
    const messageBox = useMessageBox()
    const { detail } = usePreviewContext()

    const openInNewWindow = () => navigator.newWindow({routeName: "Preview", params: {type: "image", imageIds: [detail.id.value!]}})

    const del = async () => {
        if(await messageBox.showYesNoMessage("warn", "确定要删除此项吗？", "此操作不可撤回。")) {
            detail.deleteTarget()
        }
    }

    //TODO 完成image detail view右键菜单功能 (剪贴板，目录，导出)
    return usePopupMenu([
        {type: "normal", label: "在新窗口中打开", click: openInNewWindow},
        {type: "separator"},
        {type: "normal", label: "加入剪贴板"},
        {type: "separator"},
        {type: "normal", label: "添加到目录"},
        {type: "normal", label: "添加到\"X\""},
        {type: "normal", label: "添加到临时目录"},
        {type: "separator"},
        {type: "normal", label: "导出"},
        {type: "separator"},
        {type: "normal", label: "删除此项目", click: del}
    ])
}
