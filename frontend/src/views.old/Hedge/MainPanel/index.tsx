import { defineComponent, KeepAlive, provide } from "vue"
import { RouterView } from "vue-router"
import SideLayout from "@/layouts/layouts/SideLayout"
import SideBar from "../SideBar"
import SideBarContent from "./SideBarContent"
import { sideBarContextInjection, useSideBarContextInjection } from "./inject"
import style from "./style.module.scss"

export default defineComponent({
    setup() {
        provide(sideBarContextInjection, useSideBarContextInjection())

        return () => <div class={style.root}>
            <SideLayout v-slots={{side: () => <SideBar><SideBarContent/></SideBar>}}>
                {/*解决了JSX KeepAlive问题，后面还需要再解决各个页面下的滚动条位置保存问题*/}
                <RouterView v-slots={{default: ({ Component }) => <KeepAlive>{Component}</KeepAlive>}}/>
            </SideLayout>
        </div>
    }
})
