import { computed, defineComponent, inject, nextTick, ref, watch } from "vue"
import { watchElementResize } from "@/functions/utils/element"
import { numbers } from "@/utils/primitives"
import { dashboardZoomInjection } from "./inject"
import style from "./style.module.scss"

/*
 * image dashboard核心算法：
 * 该算法的输入为image.(width, height)属性，view.(width, height)属性，view.(scrollTop, scrollLeft)，缩放属性zoom。
 * 计算目标是计算出container容器的container.(width, height)，以及container容器的margin.(top, left)作为矫正距离，
 * 还包括view.(scrollTop, scrollLeft)，作为显示区域在变换中的矫正。
 */
export default defineComponent({
    props: {
        src: {type: String, required: true}
    },
    setup(props) {
        const viewRef = ref<HTMLElement>()
        const containerRef = ref<HTMLElement>()
        const imageRef = ref<HTMLImageElement>()

        const view = ref<Rect | null>(null)
        const aspect = ref<number | null>(null)
        const { zoom } = inject(dashboardZoomInjection)!

        watchElementResize(viewRef, rect => {
            //view的值变化/初始化。触发container重算。
            view.value = {width: rect.width, height: rect.height}
        })

        const imageLoadedEvent = async (e: Event) => {
            //图像加载完成，用natural属性计算其aspect
            const el = e.target as HTMLImageElement
            aspect.value = el.naturalHeight > 0 && el.naturalWidth > 0 ? el.naturalWidth / el.naturalHeight : null
        }

        const container = computed(() => {
            if(view.value !== null && aspect.value !== null) {
                return computeContainerProps(view.value, aspect.value, zoom.value)
            }
            return null
        })

        watch(zoom, async (zoom, oldZoom) => {
            if(view.value !== null && aspect.value !== null && container.value !== null && viewRef.value !== undefined) {
                const oldScroll = {top: viewRef.value.scrollTop, left: viewRef.value.scrollLeft}
                const position = computeScrollPosition(view.value, container.value, zoom, oldZoom, oldScroll)
                await nextTick()
                viewRef.value.scrollTo({...position, behavior: "auto"})
            }
        })

        const containerStyle = computed(() => container.value !== null ? {
            "width": `${container.value.width}px`,
            "height": `${container.value.height}px`,
            "margin-left": `${container.value.left}px`,
            "margin-top": `${container.value.top}px`
        } : undefined)

        return () => <div ref={viewRef} class={style.imageDashboard}>
            <div ref={containerRef} class={style.imageContainer} style={containerStyle.value}>
                <img ref={imageRef} src={props.src} alt="detail image" onLoad={imageLoadedEvent}/>
            </div>
        </div>
    }
})

interface Rect { width: number, height: number }
interface Margin { top: number, left: number }

/**
 * 计算新的container的尺寸和偏移位置。
 * 当zoom或view发生变化时，应该重新计算。
 */
function computeContainerProps(view: Rect, aspect: number, zoom: number): Rect & Margin {
    const viewAspect: number = view.width / view.height
    const stdContainer: Rect
        = aspect > viewAspect ? {width: view.width, height: view.width / aspect}
        : aspect < viewAspect ? {width: view.height * aspect, height: view.height}
            : view
    const containerRect: Rect = {
        width: stdContainer.width * zoom / 100,
        height: stdContainer.height * zoom / 100
    }
    const containerMargin: Margin = {
        top: containerRect.height < view.height ? (view.height - containerRect.height) / 2 : 0,
        left: containerRect.width < view.width ? (view.width - containerRect.width) / 2 : 0
    }

    return {...containerRect, ...containerMargin}
}

/**
 * 计算新的container的滚动位置。
 * 当zoom发生变化时(container也会变化)，应该重新计算。
 * FUTURE: 这个算法似乎还有点瑕疵，需要优化。
 */
function computeScrollPosition(view: Rect, container: Rect, zoom: number, oldZoom: number, oldScroll: Margin): Margin {
    const zoomAspect: number = zoom / oldZoom
    const oldDelta: Margin = {
        top: oldScroll.top + view.height / 2,
        left: oldScroll.left + view.width / 2
    }
    const delta: Margin = {
        top: zoomAspect * oldDelta.top,
        left: zoomAspect * oldDelta.left
    }

    return {
        top: numbers.between(0, delta.top - view.height / 2, container.height - view.height),
        left: numbers.between(0, delta.left - view.width / 2, container.width - view.width)
    }
}
