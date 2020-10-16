import { defineComponent, Ref, ref } from "vue"
import TopBar from "../../TopBar"
import TopBarContent, { PanelType } from "./TopBarContent"
import PanelCalendar from "./PanelCalendar"
import PanelTimeline from "./PanelTimeline"
import "./style.scss"

export default defineComponent({
    setup() {
        const panelType: Ref<PanelType> = ref("timeline")

        /**
         * 给出两种视图，右上角切换，保存视图选择。
         * 视图1:日历视图，满铺的月级日历，横条选择年月，可左右跳。
         * 视图2:时间线视图，按时间降序列出一个列表。右侧还有一栏，给出年-月的时间线列表，点击会使左侧列表跳转。
         */
        return () => <div id="hedge-partitions">
            {panelType.value === "calendar" ? <PanelCalendar/> : <PanelTimeline/>}
            <TopBar>
                {() => <TopBarContent panel={panelType.value} onUpdatePanel={(v: PanelType) => panelType.value = v}/>}
            </TopBar>
        </div>
    }
})