import { computed, defineComponent, inject, ref, Transition } from "vue"
import { sideBarSwitchInjection } from ".."
import "./style.scss"

/**
 * 内容区域的顶栏模块。
 * 基本上只提供内容显示框架。包括一个侧边栏控制开关(仅关闭时)，以及slot.default留出的内容区域。
 * 它还负责调整好内容区域的显示范围问题。在macOS平台上为红绿灯的留白、侧边栏响应联动等问题都在组件内已解决。slot只负责顶栏业务。
 */
export default defineComponent({
    setup(props, { slots }) {
        const platform = ref("macOS")   //inject it
        const isFullScreen = ref(false) //inject it
        const layoutCSS = computed(() => {
            if(isFullScreen.value || sideBarSwitch.value || platform.value !== "macOS") {
                return "web"
            }else{
                return "macos"
            }
        })

        const sideBarSwitch = inject(sideBarSwitchInjection)
        const openSideBar = () => {
            sideBarSwitch.value = true
        }

        return () => <div class={`v-top-bar platform-${layoutCSS.value}`}>
            <div class="title-bar absolute top w-100"></div>
            <Transition name="v-collapse-button">
                {() => !sideBarSwitch.value && <button class="no-drag button is-white is-small v-collapse-button" onClick={openSideBar}><span class="icon"><i class="fa fa-lg fa-bars"/></span></button>}
            </Transition>
            <div class={`v-content ${sideBarSwitch.value ? "hide" : "show"}-cl-btn`}>
                {slots.default?.()}
            </div>
        </div>
    }
})