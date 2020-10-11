import { defineComponent } from "vue"
import SideLayout from "../SideLayout"
import SideBar from "../SideBar"
import TopBar from "../TopBar"
import SideBarOfDetailPanel from "./SideBarOfDetailPanel"
import TopBarOfDetailPanel from "./TopBarOfDetailPanel"
import DetailImage from "../DetailImage"
import "./style.scss"

/**
 * 展示大图的详情面板。
 */
export default defineComponent({
    setup() {
        return () => <div class="v-detail-panel">
        <SideLayout>
            {{
                side: () => <SideBar>
                    {() => <SideBarOfDetailPanel/>}
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