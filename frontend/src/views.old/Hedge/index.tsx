import { defineComponent, ref, provide, InjectionKey, Ref, KeepAlive, Transition } from "vue"
import { sideBarSwitchInjection, sideBarWidthInjection } from "@/layouts/layouts/SideLayout"
import MainPanel from "./MainPanel"
import GridPanel from "./GridPanel"
import DetailPanel from "./DetailPanel"
import style from "./style.module.scss"

export { sideBarSwitchInjection, sideBarWidthInjection }

export const panelInjection: InjectionKey<Ref<PanelType>> = Symbol() //UI测试用。正式UX不会这么控制。

type PanelType = "main" | "grid" | "detail"

export default defineComponent({
    setup() {
        const sideBarSwitch = ref(true)
        const sideBarWidth = ref(225)

        provide(sideBarSwitchInjection, sideBarSwitch)
        provide(sideBarWidthInjection, sideBarWidth)

        /**
         * 实际应该不会用简单的switch模式。这种模式不能解决grid panel的keep alive问题。
         * 应该用更复杂的注入结构和函数单独控制grid panel和detail panel的开启和历史问题。
         */
        const panel: Ref<PanelType> = ref("main")

        provide(panelInjection, panel)

        return () => <div id="hedge" class={style.root}>
            <MainPanel/>
            <Transition name="v-other-panel-transition">
                {panel.value === "grid" ? <GridPanel/>
                : panel.value === "detail" ? <DetailPanel/>
                : null
                }
            </Transition>
        </div>
    }
})
