import { defineComponent, ref, provide, KeepAlive } from "vue"
import { RouterView } from "vue-router"
import { sideBarSwitchInjection } from "@/layouts/SideLayout"
import SideLayout, { SideBar } from "@/layouts/SideLayout"
import style from "./style.module.scss"

export { sideBarSwitchInjection }

export default defineComponent({
    setup() {
        const sideBarSwitch = ref(true)

        provide(sideBarSwitchInjection, sideBarSwitch)

        return () => {
            const sideSlots = {
                default() { return <div>content</div> },
                bottom() { return <div>bottom</div> }
            }
            const sideLayoutSlots = {
                side() { return <SideBar v-slots={sideSlots}/> },
                default() { return <RouterView v-slots={{default: ({ Component }) => <KeepAlive>{Component}</KeepAlive>}}/> /*JSX RouterView的KeepAlive*/ }
            }
            return <div class={style.root}>
                <SideLayout v-slots={sideLayoutSlots}/>
            </div>
        }
    }
})
