import { defineComponent } from "vue"
import { RouterView } from "vue-router"
import SideLayout from "../../../layouts/SideLayout"
import SideBar from "../SideBar"
import SideBarContent from "./SideBarContent"
import "./style.scss"

export default defineComponent({
    setup() {
        return () => <div id="main-panel">
            <SideLayout v-slots={{
                side: () => <SideBar>
                    <SideBarContent/>
                </SideBar>, 
                default: () => <RouterView/>
            }}/>
        </div>
    }
})