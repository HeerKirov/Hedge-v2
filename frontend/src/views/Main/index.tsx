import { defineComponent, ref, provide, KeepAlive } from "vue"
import { RouterView } from "vue-router"
import { windowManager, clientMode } from "@/functions/service"
import SideLayout, { SideBar, sideBarSwitchInjection } from "@/layouts/SideLayout"
import SideBarContent from "./SideBarContent"
import { SideBarContextInjection, useSideBarContextInjection } from "./inject"
import style from "./style.module.scss"

export default defineComponent({
    setup() {
        const sideBarSwitch = ref(true)
        const sideBarContent = useSideBarContextInjection()

        provide(sideBarSwitchInjection, sideBarSwitch)
        provide(SideBarContextInjection, sideBarContent)

        return () => {
            const sideSlots = {
                default() { return <SideBarContent/> },
                bottom() {
                    return <div>
                        <button disabled={!clientMode} class="button is-lightgrey mr-1 radius-large" onClick={windowManager.openSetting}><span class="icon"><i class="fa fa-cog"/></span></button>
                        <button class="button is-lightgrey mr-1 radius-large" onClick={windowManager.openGuide}><span class="icon"><i class="fa fa-question-circle"/></span></button>
                        {/*TODO 完成clipboard组件*/}
                        <button class="button is-lightgrey mr-1 radius-large"><span class="icon"><i class="fa fa-clipboard"/></span><span>777</span></button>
                        {/*TODO 完成background task组件*/}
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
