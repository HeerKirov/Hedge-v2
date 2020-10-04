import { computed, defineComponent, inject, ref, Transition } from "vue"
import { sideBarSwitchInjection } from "../../Hedge"

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
            <Transition name="v-collapse-button">
                {() => !sideBarSwitch.value && <button class="no-drag button is-white is-small v-collapse-button" onClick={openSideBar}><span class="icon"><i class="fa fa-lg fa-bars"/></span></button>}
            </Transition>
            <div class={`v-top-bar-content ${sideBarSwitch.value ? "hide" : "show"}-cl-btn`}>
                {slots.default()}
            </div>
        </div>
    }
})