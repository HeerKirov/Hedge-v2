import { defineComponent, ref, provide, InjectionKey, Ref, KeepAlive, Transition } from "vue"
import { sideBarSwitchInjection, sideBarWidthInjection } from "@/layouts/SideLayout"
import MainPanel from "./MainPanel"
import GridPanel from "./GridPanel"
import DetailPanel from "./DetailPanel"
import "./style.scss"

export { sideBarSwitchInjection, sideBarWidthInjection }

export const panelInjection: InjectionKey<Ref<PanelType>> = Symbol() //UI测试用。正式UX不会这么控制。

type PanelType = "main" | "grid" | "detail"

export default defineComponent({
    setup() {
        const sideBarSwitch = ref(true)
        const sideBarWidth = ref(225)

        provide(sideBarSwitchInjection, sideBarSwitch)
        provide(sideBarWidthInjection, sideBarWidth)

        const panel: Ref<PanelType> = ref("main")

        provide(panelInjection, panel)

        return () => <div id="hedge">
            <KeepAlive>
                <Transition name="v-main-panel-transition">
                    {panel.value === "main" && <MainPanel/>}
                </Transition>
            </KeepAlive>
            <Transition name="v-other-panel-transition">
                {panel.value === "grid" ? <GridPanel/>
                : panel.value === "detail" ? <DetailPanel/>
                : null
                }
            </Transition>
        </div>
    }
})