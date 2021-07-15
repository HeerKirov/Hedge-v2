import { computed, defineComponent, inject, reactive, ref, watch } from "vue"
import { watchGlobalKeyEvent } from "@/functions/document/global-key"
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

        return () => IMAGE_EXTENSIONS.includes(extension.value) ? <ImageDashboard src={props.src}/> :
            VIDEO_EXTENSIONS.includes(extension.value) ? <VideoDashboard src={props.src}/> :
                null
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

        return () => <div class={style.imageDashboard}>
            <div ref={containerRef} class={style.imageContainer} style={zoomStyle.value}>
                <img src={props.src} alt="detail image"/>
            </div>
        </div>
    }
})

const VideoDashboard = defineComponent({
    props: {
        src: {type: String, required: true}
    },
    setup(props) {
        const videoRef = ref<HTMLMediaElement>()

        const state = reactive({
            playing: true,
            volume: 1,
            currentTime: 0,
            duration: NaN
        })

        const playOrPause = () => {
            if(videoRef.value !== undefined) {
                if(videoRef.value.paused) {
                    videoRef.value.play()
                }else{
                    videoRef.value.pause()
                }
            }
        }

        const fastForward = () => {
            if(!isNaN(state.duration) && state.duration !== Infinity) {
                videoRef.value!.currentTime = Math.min(state.currentTime + 3, state.duration)
            }
        }

        const fastRewind = () => {
            if(!isNaN(state.duration) && state.duration !== Infinity) {
                videoRef.value!.currentTime = Math.max(state.currentTime - 3, 0)
            }
        }

        const seek = (time: number) => {
            if(!isNaN(state.duration) && state.duration !== Infinity) {
                videoRef.value!.currentTime = time < 0 ? 0 : time > state.duration ? state.duration : time
            }
        }

        const pausedEvent = () => {
            state.playing = false
        }

        const playingEvent = () => {
            state.playing = true
        }

        const timeUpdateEvent = () => {
            state.currentTime = videoRef.value!.currentTime
        }

        const volumeChangeEvent = () => {
            state.volume = videoRef.value!.volume
        }

        const durationChangeEvent = () => {
            state.duration = videoRef.value!.duration
        }

        watch(videoRef, dom => {
            if(dom !== undefined) {
                state.playing = !dom.paused
                state.volume = dom.volume
                state.currentTime = dom.currentTime
                state.duration = dom.duration
            }
        })

        watchGlobalKeyEvent(e => {
            if(e.key === " ") {
                playOrPause()
                e.preventDefault()
                e.stopPropagation()
            }else if((e.key === "ArrowLeft" || e.key === "ArrowRight") && !e.metaKey && !e.shiftKey && !e.altKey) {
                if(e.key === "ArrowLeft") {
                    fastRewind()
                }else{
                    fastForward()
                }
                e.preventDefault()
                e.stopPropagation()
            }
        })

        return () => <div class={style.videoDashboard}>
            <video ref={videoRef} key="video" loop src={props.src}
                   onClick={playOrPause} onPause={pausedEvent} onPlaying={playingEvent}
                   onDurationchange={durationChangeEvent} onTimeupdate={timeUpdateEvent} onVolumechange={volumeChangeEvent}/>
            <VideoControls {...state} onPlayOrPause={playOrPause}/>
        </div>
    }
})

const VideoControls = defineComponent({
    props: {
        playing: Boolean,
        volume: {type: Number, required: true},
        currentTime: {type: Number, required: true},
        duration: {type: Number, required: true}
    },
    emits: ["playOrPause"],
    setup(props, { emit }) {
        const playOrPause = () => emit("playOrPause")
        //TODO 自行绘制控件
        return () => <div class={style.controls}>
            <div class={style.progressBar}>
                {(!isNaN(props.duration) && props.duration !== Infinity) && <div class={style.progressing} style={`width: ${(props.currentTime * 100 / props.duration).toFixed(3)}%`}/>}
            </div>
            <div class={style.playButton} onClick={playOrPause}><i class={`fa fa-${props.playing ? "pause" : "play"}`}/></div>
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

function getExtension(src: string): string {
    const i = src.lastIndexOf(".")
    if(i >= 0) {
        return src.substring(i + 1).toLowerCase()
    }
    return ""
}

const IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "gif"]
const VIDEO_EXTENSIONS = ["mp4", "webm", "ogv"]
