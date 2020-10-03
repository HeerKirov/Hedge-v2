import { defineComponent, onUnmounted, Ref, ref, Transition, InjectionKey, provide } from "vue"
import { RouterView } from "vue-router"
import SideBar from "./layouts/Hedge/SideBar"

export const sideBarSwitchInjection: InjectionKey<Ref<boolean>> = Symbol()

export default defineComponent({
    setup() {
        const sideBarSwitch = ref(true)
        const { sizeBarWidth, resizeAreaMouseDown } = useResizeBar()

        provide(sideBarSwitchInjection, sideBarSwitch)

        return () => <div class="v-hedge">
            <div class="v-content" style={{"left": `${sideBarSwitch.value ? sizeBarWidth.value : 0}px`}}>
                <RouterView/>
            </div>
            <Transition name="v-side-bar-collapse">
                {() => sideBarSwitch.value && <SideBar style={{"width": `${sizeBarWidth.value}px`}}/>}
            </Transition>
            {sideBarSwitch.value && <div class="v-resize-bar" style={{"left": `${sizeBarWidth.value}px`}} onMousedown={resizeAreaMouseDown}/>}
        </div>
    }
})

function useResizeBar(defaultValue: number = 225) {
    const maxWidth = 300, minWidth = 150

    const sizeBarWidth: Ref<number> = ref(defaultValue)

    const resizeAreaMouseDown = () => {
        document.addEventListener('mousemove', mouseMove)
        document.addEventListener('mouseup', mouseUp)
        return false
    }

    const mouseMove = (e: MouseEvent) => {
        const newWidth = e.pageX
        sizeBarWidth.value = newWidth > maxWidth ? maxWidth : newWidth < minWidth ? minWidth : newWidth
    }

    const mouseUp = () => {
        document.removeEventListener('mousemove', mouseMove)
        document.addEventListener('mouseup', mouseUp)
    }

    onUnmounted(() => {
        document.removeEventListener('mousemove', mouseMove)
        document.addEventListener('mouseup', mouseUp)
    })

    return {sizeBarWidth, resizeAreaMouseDown}
}