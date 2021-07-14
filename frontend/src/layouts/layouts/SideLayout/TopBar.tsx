import { computed, defineComponent, inject, Transition } from "vue"
import { useAppInfo, useFullscreen } from "@/functions/app"
import { sideBarSwitchInjection } from "./index"
import style from "./style.module.scss"

/**
 * 内容区域的顶栏模块。提供了一个供content区域使用的标准顶栏框架。
 * 它包含了一个侧边栏控制开关(仅关闭时)，链接到当前组建树上的switch属性。它还负责调整好内容区域的显示范围问题，在macOS平台上为红绿灯的留白、侧边栏响应联动等问题都在组件内已解决。slot只负责顶栏业务即可。
 */
export default defineComponent({
    props: {
        transparent: {type: Boolean, default: false}
    },
    setup(props, { slots }) {
        const { platform } = useAppInfo()
        const isFullscreen = useFullscreen()
        const sideBarSwitch = inject(sideBarSwitchInjection)!

        const hasDarwinButton = computed(() => platform === "darwin" && !isFullscreen.value && !sideBarSwitch.value)

        const openSideBar = () => { sideBarSwitch.value = true }

        return () => <div class={{[style.topBar]: true, [style.background]: !props.transparent, [style.hasDarwinButton]: hasDarwinButton.value, "title-bar": true}}>
            <Transition name="v-collapse-button">
                {!sideBarSwitch.value && <button class={[style.collapseButton, "no-drag", "button", "square", "is-white"]} onClick={openSideBar}><span class="icon"><i class="fa fa-lg fa-bars"/></span></button>}
            </Transition>
            <div class={{[style.content]: true, [style.hasClButton]: !sideBarSwitch.value}}>
                {slots.default?.()}
            </div>
        </div>
    }
})
