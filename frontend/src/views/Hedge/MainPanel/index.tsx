import { defineComponent, provide } from "vue"
import { RouterView } from "vue-router"
import SideLayout from "@/layouts/SideLayout"
import SideBar from "../SideBar"
import SideBarContent from "./SideBarContent"
import { SideBarDataInjection, useSideBarData } from "./inject"
import style from "./style.module.scss"

export default defineComponent({
    setup() {
        provide(SideBarDataInjection, useSideBarData())

        return () => <div class={style.root}>
            <SideLayout v-slots={{
                side: () => <SideBar>
                    <SideBarContent/>
                </SideBar>, 
                default: () => <RouterView/>
            }}/>
        </div>
    }
})