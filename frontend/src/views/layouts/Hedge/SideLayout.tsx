import { defineComponent, inject, onUnmounted, Ref, Transition } from "vue"
import { sideBarSwitchInjection, sideBarWidthInjection } from "../../Hedge"

/**
 * 主要页面的侧栏分栏结构。
 * 只提供了一个分栏结构，不包括任何内容，通过slot.side导入侧栏，slot.default导入主要内容区域。
 * 通过inject响应sideBarWidth/sideBarSwitch属性，以控制侧栏开关。
 * 这个组件可以在主要页面以及详情页面中复用，由于通过inject注入属性，因此可以实现全局共享侧栏状态。
 */
export default defineComponent({
    setup(_, { slots }) {
        const sideBarWidth = inject(sideBarWidthInjection)
        const sideBarSwitch = inject(sideBarSwitchInjection)

        const { resizeAreaMouseDown } = useResizeBar(sideBarWidth)

        return () => <div class="v-side-layout">
            <div class="v-content" style={{"left": `${sideBarSwitch.value ? sideBarWidth.value : 0}px`}}>
                {slots.default()}
            </div>
            <Transition name="v-side-bar-collapse">
                {() => sideBarSwitch.value && <div class="v-side-content" style={{"width": `${sideBarWidth.value}px`}}>
                    {slots.side()}
                </div>}
            </Transition>
            {sideBarSwitch.value && <div class="v-resize-content" style={{"left": `${sideBarWidth.value}px`}} onMousedown={resizeAreaMouseDown}/>}
        </div>
    }
})

function useResizeBar(sizeBarWidth: Ref<number>) {
    const maxWidth = 300, minWidth = 150
    const defaultWidth = 225, defaultWidthRange = 10

    const resizeAreaMouseDown = () => {
        document.addEventListener('mousemove', mouseMove)
        document.addEventListener('mouseup', mouseUp)
        return false
    }

    const mouseMove = (e: MouseEvent) => {
        const newWidth = e.pageX
        sizeBarWidth.value = newWidth > maxWidth ? maxWidth 
            : newWidth < minWidth ? minWidth 
            : Math.abs(newWidth - defaultWidth) <= defaultWidthRange ? defaultWidth 
            : newWidth
    }

    const mouseUp = () => {
        document.removeEventListener('mousemove', mouseMove)
        document.addEventListener('mouseup', mouseUp)
    }

    onUnmounted(() => {
        document.removeEventListener('mousemove', mouseMove)
        document.addEventListener('mouseup', mouseUp)
    })

    return {resizeAreaMouseDown}
}