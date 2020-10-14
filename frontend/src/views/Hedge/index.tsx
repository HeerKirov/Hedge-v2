import { defineComponent, ref, provide, InjectionKey, Ref, KeepAlive, Transition } from "vue"
import MainPanel from "./MainPanel"
import GridPanel from "./GridPanel"
import DetailPanel from "./DetailPanel"
import "./style.scss"

export const sideBarSwitchInjection: InjectionKey<Ref<boolean>> = Symbol()

export const sideBarWidthInjection: InjectionKey<Ref<number>> = Symbol()

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

        /**
         * 题外话，顶栏需要包括的东西:
         * 2. 画集需要的顶栏
         * - super搜索框
         * - 尺寸切换器
         * 3. 元数据需要的顶栏
         * - (列表)搜索框
         * 4. 文件夹需要的顶栏
         * - (文件夹列表)搜索框
         */
        return () => <div class="v-hedge">
            <KeepAlive>
                <Transition name="v-main-panel-transition">
                    {() => panel.value === "main" && <MainPanel/>}
                </Transition>
            </KeepAlive>
            <Transition name="v-other-panel-transition">
                {() => panel.value === "grid" ? <GridPanel/>
                : panel.value === "detail" ? <DetailPanel/>
                : null
                }
            </Transition>
        </div>
    }
})