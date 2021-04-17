import { defineComponent, ref, provide, KeepAlive } from "vue"
import { RouterView } from "vue-router"
import { clientMode } from "@/functions/app"
import { windowManager } from "@/functions/module"
import SideLayout, { SideBar, sideBarSwitchInjection } from "@/layouts/layouts/SideLayout"
import SideBarContent from "./SideBarContent"
import { sideBarContextInjection, useSideBarContextInjection } from "./inject"
import style from "./style.module.scss"

export default defineComponent({
    setup() {
        const sideBarSwitch = ref(true)
        const sideBarContent = useSideBarContextInjection()

        provide(sideBarSwitchInjection, sideBarSwitch)
        provide(sideBarContextInjection, sideBarContent)

        return () => {
            const sideSlots = {
                default() { return <SideBarContent/> },
                bottom() {
                    return <div>
                        <button disabled={!clientMode} class="button is-lightgrey mr-1 radius-large" onClick={windowManager.openSetting}><span class="icon"><i class="fa fa-cog"/></span></button>
                        <button class="button is-lightgrey mr-1 radius-large" onClick={windowManager.openGuide}><span class="icon"><i class="fa fa-question-circle"/></span></button>
                        <button class="button is-lightgrey mr-1 radius-large"><span class="icon"><i class="fa fa-clipboard"/></span><span>777</span></button>
                        <button class="button is-lightgrey radius-large"><span class="icon"><i class="fa fa-caret-square-right"/></span><span>5</span></button>
                    </div>
                }
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
