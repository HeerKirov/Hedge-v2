import { defineComponent } from "vue"
import SideLayout from "../SideLayout"
import SideBar from "../SideBar"
import TopBar from "../TopBar"
import Panel from "./Panel"

import TopBarContent from "./TopBarContent"
import SideBarContent from "./SideBarContent"
import "./style.scss"

/**
 * 用来展示成组的内容(集合/画集)的覆盖式弹出面板。
 */
export default defineComponent({
    setup() {
        return () => <div id="grid-panel">
            <SideLayout>
                {{
                    side: () => <SideBar>
                        {() => <SideBarContent/>}
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