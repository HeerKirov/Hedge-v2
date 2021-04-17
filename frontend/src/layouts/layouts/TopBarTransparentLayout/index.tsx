import { defineComponent, inject, InjectionKey, Ref, ref, Transition } from "vue"
import TopBar from "@/layouts/layouts/SideLayout/TopBar"
import style from "./style.module.scss"

/**
 * 一个包装区域，提供：
 * - top bar区域。
 * - 主要内容显示区域。
 * 它的主要特征是主要内容区域覆盖了整个区域，并提供滚动选项和留出padding-top选项，且top bar浮动在内容上方。
 */
export default defineComponent({
    props: {
        scrollable: {type: Boolean, default: false},
        paddingForTopBar: {type: Boolean, default: false}
    },
    setup(props, { slots }) {
        return () => <div class={style.topBarLayout}>
            {slots.default && <div class={{[style.mainContent]: true, [style.scrollable]: props.scrollable, [style.paddingForTopBar]: props.paddingForTopBar}}>
                {slots.default?.()}
            </div>}
            {slots.topBar && <TopBar transparent={true}>
                {slots.topBar?.()}
            </TopBar>}
        </div>
    }
})
