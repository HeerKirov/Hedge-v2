import { defineComponent, inject } from "vue"
import { TopBar, sideBarSwitchInjection } from "@/layouts/layouts/SideLayout"
import style from "./style.module.scss"

/**
 * 一个包装区域，提供：
 * - top bar区域。
 * - 主要内容显示区域。
 * 它的主要特征是：受控折叠顶栏区域。在打开侧边栏时固定顶栏，关闭侧边栏时顶栏也变成隐藏，并在鼠标靠到顶部时浮动弹出。
 */
export default defineComponent({
    setup(_, { slots }) {
        const sideBarSwitch = inject(sideBarSwitchInjection)!

        return () => <div class={style.topBarLayout}>
            {slots.default && <div class={{[style.mainContent]: true}}>
                {slots.default?.()}
            </div>}
            {slots.topBar && <TopBar>
                {slots.topBar?.()}
            </TopBar>}
        </div>
    }
})
