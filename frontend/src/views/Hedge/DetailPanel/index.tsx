import { defineComponent, Ref, ref } from "vue"
import SideLayout from "../../../layouts/SideLayout"
import SideBar from "../SideBar"
import TopBar from "../TopBar"
import Panel from "./Panel"
import SideBarDetailInfo from "./SideBarDetailInfo"
import SideBarDetailOrigin from "./SideBarDetailOrigin"
import SideBarDetailOthers from "./SideBarDetailOthers"
import SideBottomContent from "./SideBottomContent"
import TopBarContent from "./TopBarContent"
import "./style.scss"

/**
 * 展示大图的详情面板。
 */
export default defineComponent({
    setup() {
        const sideBarTab: Ref<"info" | "origin" | "others"> = ref("info")
        const setSideBarTab = (value: "info" | "origin" | "others") => { sideBarTab.value = value }

        return () => <div id="detail-panel">
            <SideLayout>
                {{
                    side: () => <SideBar>
                        {{
                            default: () => 
                                sideBarTab.value === "info" ? <SideBarDetailInfo/> :
                                sideBarTab.value === "origin" ? <SideBarDetailOrigin/> :
                                <SideBarDetailOthers/>,
                            bottom: () => <SideBottomContent tab={sideBarTab.value} onUpdateTab={setSideBarTab}/>
                        }}
                    </SideBar>,
                    default: () => <>
                        <Panel/>
                        <TopBar>
                            {() => <TopBarContent/>}
                        </TopBar>
                    </>
                }}
            </SideLayout>
        </div>
    }
})