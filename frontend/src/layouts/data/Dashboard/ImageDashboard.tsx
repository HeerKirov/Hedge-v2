import { computed, defineComponent, inject, ref, watch } from "vue"
import { dashboardZoomInjection } from "./inject"
import style from "./style.module.scss"

export default defineComponent({
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

        return () => <div class={style.imageDashboard}>
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
            const p = `${zoom.value}%`
            return {width: p, height: p}
        })
        return {zoomStyle}
    }else{
        const zoomStyle = computed(() => ({width: "100%", height: "100%"}))
        return {zoomStyle}
    }
}
