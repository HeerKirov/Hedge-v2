import { defineComponent } from "vue"
import { RouterView } from "vue-router"
import SideLayout from "@/layouts/SideLayout"
import SideBar from "./SideBar"
import "./style.scss"

export default defineComponent({
    setup() {
        return () => <div id="setting">
            <SideLayout v-slots={{
                side: () => <SideBar/>,
                default: () => <div class="v-setting-content">
                    <div class="v-scroll-content">
                        <RouterView/>
                    </div>
                    <div class="small-title-bar absolute top w-100"/>
                </div>
            }}/>
        </div>
    }
})