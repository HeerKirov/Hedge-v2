import { defineComponent } from "vue"
import { RouterView } from "vue-router"
import SideLayout from "../SideLayout"
import SideBar from "../SideBar"
import SideBarOfMenu from "./SideBarContent"
import "./style.scss"

export default defineComponent({
    setup() {
        return () => <div class="v-main-panel">
            <SideLayout>
                {{
                    side: () => <SideBar>
                        {() => <SideBarOfMenu/>}
                    </SideBar>,
                    default: () => <RouterView/>
                }}
            </SideLayout>
        </div>
    }
})