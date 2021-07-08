import { computed, defineComponent, inject, ref, watch } from "vue"
import { dashboardZoomInjection } from "./inject"
import style from "./style.module.scss"

export { dashboardZoomInjection }

/**
 * 显示详情内容的封装组件。处理图片、视频的不同显示方式，并包装关联的高级功能。
 */
export default defineComponent({
    props: {
        src: {type: String, required: true}
    },
    setup(props) {
        const extension = computed(() => getExtension(props.src))

        return () => IMAGE_EXTENSIONS.includes(extension.value) ? <ImageDashboard src={props.src}/> : null
    }
})

const ImageDashboard = defineComponent({
    props: {
        src: {type: String, required: true}
    },
    setup(props) {
        const containerRef = ref<HTMLElement>()

        watch(containerRef, dom => {
            if(dom !== undefined) {
                console.log(`top=${dom.scrollTop}, left=${dom.scrollLeft}, height=${dom.scrollHeight}, width=${dom.scrollWidth}`)
            }
        })

        const { zoomStyle } = useZoom()

        return () => <div class={style.dashboard}>
            <div ref={containerRef} class={style.imageContainer} style={zoomStyle.value}>
                <img src={props.src} alt="detail image"/>
            </div>
        </div>
    }
})

function useZoom() {
    const dashboardZoomProps = inject(dashboardZoomInjection)
    if(dashboardZoomProps !== undefined) {
        const { zoom } = dashboardZoomProps
        const zoomStyle = computed(() => {
            const p = `${(zoom.value * 100).toFixed(3)}%`
            return {width: p, height: p}
        })
        return {zoomStyle}
    }else{
        const zoomStyle = computed(() => ({width: "100%", height: "100%"}))
        return {zoomStyle}
    }
}

function getExtension(src: string): string {
    const i = src.lastIndexOf(".")
    if(i >= 0) {
        return src.substring(i + 1).toLowerCase()
    }
    return ""
}

const IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "gif"]
