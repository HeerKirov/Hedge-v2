import { defineComponent } from "vue"
import SideLayout from "../SideLayout"
import SideBar from "../SideBar"
import TopBar from "../TopBar"
import Panel from "./Panel"

import TopBarOfGridPanel from "./TopBarContent"
import SideBarOfGridPanel from "./SideBarContent"
import "./style.scss"

/**
 * 用来展示成组的内容(集合/画集)的覆盖式弹出面板。
 */
export default defineComponent({
    setup() {
        return () => <div class="v-grid-panel">
            <SideLayout>
                {{
                    side: () => <SideBar>
                        {() => <SideBarOfGridPanel/>}
                    </SideBar>,
                    default: () => <>
                        <Panel/>
                        <TopBar>
                            {() => <TopBarOfGridPanel/>}
                        </TopBar>
                    </>
                }}
            </SideLayout>
        </div>
    }
})