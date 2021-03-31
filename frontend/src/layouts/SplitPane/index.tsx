import { defineComponent, onUnmounted, ref, Ref } from "vue"
import PaneBasicLayout from "./PaneBasicLayout"
import style from "./style.module.scss"

export { PaneBasicLayout }

/**
 * 右侧分栏的双面板结构，右侧的侧边栏可以有限拉伸和被开关控制隐藏。
 */
export default defineComponent({
    props: {
        defaultWidth: {type: Number, default: 250},
        maxWidth: {type: Number, default: 300},
        minWidth: {type: Number, default: 200},
        showPane: {type: Boolean, default: true}
    },
    setup(props, { slots }) {
        const paneWidth = ref(props.defaultWidth)
        const splitPaneRef = ref<HTMLElement>()

        const { resizeAreaMouseDown } = useResizeBar(splitPaneRef, paneWidth, {
            defaultWidth: props.defaultWidth,
            maxWidth: props.maxWidth,
            minWidth: props.minWidth,
            attachRange: 10
        })

        return () => <div ref={splitPaneRef} class={style.splitPane}>
            <div class={style.content} style={{"right": `${props.showPane ? paneWidth.value : 0}px`}}>
                {slots.default?.()}
            </div>
            {props.showPane && <>
                <div class={style.sideContent} style={{"width": `${paneWidth.value}px`}}>
                    {slots.pane?.()}
                </div>
                <div class={style.resizeContent} style={{"right": `${paneWidth.value}px`}} onMousedown={resizeAreaMouseDown}/>
            </>}
        </div>
    }
})

function useResizeBar(splitPaneRef: Ref<HTMLElement | undefined>, paneWidth: Ref<number>, configure: {defaultWidth: number, maxWidth: number, minWidth: number, attachRange: number}) {
    const { defaultWidth, maxWidth, minWidth, attachRange } = configure

    const resizeAreaMouseDown = () => {
        document.addEventListener('mousemove', mouseMove)
        document.addEventListener('mouseup', mouseUp)
        return false
    }

    const mouseMove = (e: MouseEvent) => {
        if(splitPaneRef.value) {
            const newWidth = splitPaneRef.value.getBoundingClientRect().left + splitPaneRef.value.clientWidth - e.pageX
            paneWidth.value
                = newWidth > maxWidth ? maxWidth
                : newWidth < minWidth ? minWidth
                    : Math.abs(newWidth - defaultWidth) <= attachRange ? defaultWidth
                        : newWidth
        }
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