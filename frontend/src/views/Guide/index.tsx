import { defineComponent } from "vue"
import { RouterView } from "vue-router"
import SideLayout from "../../layouts/SideLayout"
import SideBar from "./SideBar"
import "./style.scss"

export default defineComponent({
    setup() {
        return () => <div id="guide">
            <SideLayout>
                {{
                    side: () => <SideBar/>,
                    default: () => <div class="v-guide-content">
                        <div class="v-scroll-content">
                            <RouterView/>
                        </div>
                        <div class="small-title-bar absolute top w-100"/>
                    </div>
                }}
            </SideLayout>
        </div>
    }
})