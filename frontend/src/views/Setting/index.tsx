import { defineComponent } from "vue"
import { RouterView } from "vue-router"
import SideLayout from "../../layouts/SideLayout"
import SideBar from "./SideBar"
import "./style.scss"

export default defineComponent({
    setup() {
        return () => <div id="setting">
            <SideLayout>
                {{
                    side: () => <SideBar/>,
                    default: () => <div class="v-setting-content">
                        <RouterView/>
                        <div class="small-title-bar absolute top w-100"/>
                    </div>
                }}
            </SideLayout>
        </div>
    }
})