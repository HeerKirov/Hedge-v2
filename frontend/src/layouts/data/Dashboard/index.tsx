import { computed, defineComponent, inject, watch } from "vue"
import VideoDashboard from "./VideoDashboard"
import ImageDashboard from "./ImageDashboard"
import { dashboardZoomInjection } from "./inject"

export { dashboardZoomInjection }

/**
 * 显示详情内容的封装组件。处理图片、视频的不同显示方式，并包装关联的高级功能。
 */
export default defineComponent({
    props: {
        src: {type: String, required: true}
    },
    setup(props) {
        const { enable } = inject(dashboardZoomInjection)!

        const type = computed(() => getDashboardType(props.src))

        watch(type, type => enable.value = type === "Image", {immediate: true})

        return () => {
            return type.value === "Image" ? <ImageDashboard src={props.src}/> :
                type.value === "Video" ? <VideoDashboard src={props.src}/> : null
        }
    }
})

function getExtension(src: string): string {
    const i = src.lastIndexOf(".")
    if(i >= 0) {
        return src.substring(i + 1).toLowerCase()
    }
    return ""
}

function getDashboardType(src: string): "Image" | "Video" | null {
    const extension = getExtension(src)
    return IMAGE_EXTENSIONS.includes(extension) ? "Image" : VIDEO_EXTENSIONS.includes(extension) ? "Video" : null
}

const IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "gif"]
const VIDEO_EXTENSIONS = ["mp4", "webm", "ogv"]
