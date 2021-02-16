import { defineComponent, inject } from "vue"
import { sideBarSwitchInjection } from "."
import style from "./style.module.scss"

/**
 * 主页面的侧栏内容的框架模块。提供了一个标准侧边栏布局框架，包括折叠按钮、内容区域、底栏。
 */
export default defineComponent({
    setup(_, { slots }) {
        const sideBarSwitch = inject(sideBarSwitchInjection)!
        const collapseSideBar = () => {
            sideBarSwitch.value = false
        }

        return () => <div class={style.sideBar}>
            <div class="title-bar absolute left-top w-100"/>
            <button class={[style.collapseButton, "no-drag", "button", "square"]} onClick={collapseSideBar}><span class="icon"><i class="fa fa-bars fa-lg"/></span></button>
            <div class={{[style.content]: true, [style.withBottom]: !!slots.bottom}}>
                {slots.default?.()}
            </div>
            {slots.bottom && <div class={style.buttons}>
                {slots.bottom()}
            </div>}
        </div>
    }
})
