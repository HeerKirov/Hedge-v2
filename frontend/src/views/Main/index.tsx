import { defineComponent, ref, provide, Transition, computed } from "vue"
import { RouterView } from "vue-router"
import { clientMode } from "@/functions/app"
import { windowManager } from "@/functions/module"
import { installImportService } from "@/functions/api/install"
import SideLayout, { SideBar, sideBarSwitchInjection, sideBarWidthInjection, DEFAULT_WIDTH } from "@/layouts/layouts/SideLayout"
import SideBarContent from "./SideBarContent"
import ViewStacks, { installViewStacks } from "./ViewStacks"
import { installSideBarContext } from "./inject"
import style from "./style.module.scss"

export default defineComponent({
    setup() {
        installImportService()
        installSideBarContext()

        const viewStacks = installViewStacks()

        provide(sideBarSwitchInjection, ref(true))
        provide(sideBarWidthInjection, ref(DEFAULT_WIDTH))

        const stackExists = computed(() => viewStacks.stacks.value.length > 0)

        const sideSlots = {
            default() { return <SideBarContent/> },
            bottom() {
                return <div>
                    <button disabled={!clientMode} class="button is-sidebar mr-1 radius-large" onClick={windowManager.openSetting}><span class="icon"><i class="fa fa-cog"/></span></button>
                    <button class="button is-sidebar mr-1 radius-large" onClick={windowManager.openGuide}><span class="icon"><i class="fa fa-question-circle"/></span></button>
                    <button class="button is-sidebar mr-1 radius-large"><span class="icon"><i class="fa fa-clipboard"/></span><span>777</span></button>
                    <button class="button is-sidebar radius-large"><span class="icon"><i class="fa fa-caret-square-right"/></span><span>5</span></button>
                </div>
            }
        }
        const sideLayoutSlots = {
            side() { return <SideBar v-slots={sideSlots}/> },
            default() { return <RouterView/> }
        }
        return () => <div class={style.root}>
            <SideLayout v-slots={sideLayoutSlots}/>
            <Transition enterActiveClass={style.coverEnterActive} leaveActiveClass={style.coverLeaveActive}
                        enterFromClass={style.coverEnterFrom} leaveToClass={style.coverLeaveTo}>
                {stackExists.value && <div class={style.cover}/>}
            </Transition>
            <ViewStacks/>
        </div>
    }
})
