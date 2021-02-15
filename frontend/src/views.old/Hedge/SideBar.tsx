import { defineComponent, inject } from "vue"
import { sideBarSwitchInjection } from "."
import style from "./style.module.scss"

/**
 * 主页面的侧栏内容的框架模块。只提供布局框架，以及基本功能，比如折叠按钮，以及底栏的基本功能按钮。
 */
export default defineComponent({
    setup(_, { slots }) {
        const sideBarSwitch = inject(sideBarSwitchInjection)!
        const collapseSideBar = () => {
            sideBarSwitch.value = false
        }

        return () => <div class={style.sideBar}>
            <div class="title-bar absolute left-top w-100"/>
            <button class={[style.collapseButton, "no-drag", "button", "is-light", "is-small"]} onClick={collapseSideBar}><span class="icon"><i class="fa fa-lg fa-bars"/></span></button>
            <div class={style.content}>
                {slots.default?.()}
            </div>
            <div class={style.buttons}>
                {slots.bottom?.() ?? <div class="buttons">
                    <button class="button is-small is-light mb-0 mr-1 radius-large"><span class="icon"><i class="fa fa-cog"/></span></button>
                    <button class="button is-small is-light mb-0 mr-1 radius-large"><span class="icon"><i class="fa fa-question-circle"/></span></button>
                    <button class="button is-small is-light mb-0 mr-0 radius-large"><span class="icon mr-1"><i class="fa fa-clipboard"/></span>777</button>
                    {/*剪贴板会在存在内容时浮现出来，并提示内容数量。点击剪贴板按钮会弹出一个modal浏览剪贴板内的项目内容，并且可以简单编辑内容列表，比如移除一些项 */}
                </div>}
            </div>
        </div>
    }
})
