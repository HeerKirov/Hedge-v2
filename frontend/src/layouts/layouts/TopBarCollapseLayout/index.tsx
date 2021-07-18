import { defineComponent, inject, ref, watch } from "vue"
import { TopBar, sideBarSwitchInjection } from "@/layouts/layouts/SideLayout"
import { useMouseHover } from "@/functions/utils/element"
import { sleep } from "@/utils/process"
import style from "./style.module.scss"

/**
 * 一个包装区域，提供：
 * - top bar区域。
 * - 主要内容显示区域。
 * 它的主要特征是：受控折叠顶栏区域。在打开侧边栏时固定顶栏，关闭侧边栏时顶栏也变成隐藏，并在鼠标靠到顶部时浮动弹出。
 */
export default defineComponent({
    setup(_, { slots }) {
        const fixed = inject(sideBarSwitchInjection)!

        const { hover, mouseover, mouseleave } = useMouseHover()

        const hidden = ref(false)

        watch(hover, async (v, _, onInvalidate) => {
            if(v) {
                hidden.value = true
            }else{
                let validate = true
                onInvalidate(() => validate = false)
                await sleep(500)
                if(validate && !hover.value) {
                    hidden.value = false
                }
            }
        })

        return () => <div class={style.topBarLayout}>
            {slots.default && <div class={{[style.mainContent]: true, [style.fixed]: fixed.value}}>
                {slots.default?.()}
            </div>}
            {slots.topBar && <div class={style.topBarArea} onMouseover={mouseover} onMouseleave={mouseleave}>
                {!fixed.value && <div class={style.topBarTriggerArea}/>}
                <TopBar class={{[style.topBarComponent]: true, [style.hidden]: !fixed.value && !hidden.value}}>
                    {slots.topBar?.()}
                </TopBar>
            </div>}
        </div>
    }
})
