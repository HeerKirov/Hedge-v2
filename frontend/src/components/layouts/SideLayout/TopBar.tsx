import { computed, defineComponent, Transition } from "vue"
import { useFullscreen } from "@/services/app"
import { clientPlatform } from "@/functions/adapter-ipc"
import { useSideBarLayout } from "."
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
        const isFullscreen = useFullscreen()
        const sideBarSwitch = useSideBarLayout()!
        const openSideBar = () => { sideBarSwitch.value = true }

        if(clientPlatform === "darwin") {
            const hasDarwinButton = computed(() => !(isFullscreen.value || sideBarSwitch.value))

            return () => <div class={{[style.topBar]: true, [style.background]: !props.transparent, [style.hasDarwinButton]: hasDarwinButton.value, "title-bar": true}}>
                <Transition enterFromClass={style.transactionEnterFrom} leaveToClass={style.transactionLeaveTo} enterActiveClass={style.transactionEnterActive} leaveActiveClass={style.transactionLeaveActive}>
                    {!sideBarSwitch.value && <button class={[style.collapseButton, "no-drag", "button", "square", "is-white"]} onClick={openSideBar}><span class="icon"><i class="fa fa-lg fa-bars"/></span></button>}
                </Transition>
                <div class={{[style.content]: true, [style.hasClButton]: !sideBarSwitch.value}}>
                    {slots.default?.()}
                </div>
            </div>
        }else{
            return () => <div class={{[style.topBar]: true, [style.background]: !props.transparent, "title-bar": true}}>
                <Transition enterFromClass={style.transactionEnterFrom} leaveToClass={style.transactionLeaveTo} enterActiveClass={style.transactionEnterActive} leaveActiveClass={style.transactionLeaveActive}>
                    {!sideBarSwitch.value && <button class={[style.collapseButton, "no-drag", "button", "square", "is-white"]} onClick={openSideBar}><span class="icon"><i class="fa fa-lg fa-bars"/></span></button>}
                </Transition>
                <div class={{[style.content]: true, [style.hasClButton]: !sideBarSwitch.value}}>
                    {slots.default?.()}
                </div>
            </div>
        }
    }
})
