import { defineComponent, Ref, ref } from "vue"
import SideLayout from "../SideLayout"
import SideBar from "../SideBar"
import TopBar from "../TopBar"
import SideBarDetailInfo from "./SideBarDetailInfo"
import SideBarDetailOrigin from "./SideBarDetailOrigin"
import SideBarDetailOthers from "./SideBarDetailOthers"
import SideBottomOfDetail from "./SideBottomOfDetail"
import TopBarOfDetailPanel from "./TopBarOfDetailPanel"
import DetailImage from "../../../layouts/ImageDetail"
import "./style.scss"

/**
 * 展示大图的详情面板。
 */
export default defineComponent({
    setup() {
        const sideBarTab: Ref<"info" | "origin" | "others"> = ref("info")
        const setSideBarTab = (value: "info" | "origin" | "others") => { sideBarTab.value = value }

        return () => <div class="v-detail-panel">
            <SideLayout>
                {{
                    side: () => <SideBar>
                        {{
                            default: () => 
                                sideBarTab.value === "info" ? <SideBarDetailInfo/> :
                                sideBarTab.value === "origin" ? <SideBarDetailOrigin/> :
                                <SideBarDetailOthers/>,
                            bottom: () => <SideBottomOfDetail tab={sideBarTab.value} onUpdateTab={setSideBarTab}/>
                        }}
                    </SideBar>,
                    default: () => <>
                        <DetailImage/>
                        <TopBar>
                            {() => <TopBarOfDetailPanel/>}
                        </TopBar>
                    </>
                }}
            </SideLayout>
        </div>
    }
})