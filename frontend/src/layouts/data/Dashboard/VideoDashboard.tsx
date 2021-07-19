import { computed, defineComponent, onUnmounted, reactive, Ref, ref, watch } from "vue"
import { watchGlobalKeyEvent } from "@/functions/document/global-key"
import { useMouseHover } from "@/functions/utils/element"
import { useLocalStorageWithDefault } from "@/functions/app"
import { numbers } from "@/utils/primitives"
import { sleep } from "@/utils/process"
import style from "./style.module.scss"

export default defineComponent({
    props: {
        src: {type: String, required: true}
    },
    setup(props) {
        const videoRef = ref<HTMLMediaElement>()

        const state = reactive<State>({
            playing: true,
            volume: 1,
            muted: false,
            currentTime: 0,
            duration: NaN
        })

        const { playOrPause, fastForward, fastRewind, seek, pausedEvent, playingEvent, durationChangeEvent, timeUpdateEvent } = usePlayControl(videoRef, state)

        const { updateVolume, updateMuted } = useVolumeControl(videoRef, state)

        watch(videoRef, dom => {
            if(dom !== undefined) {
                state.playing = !dom.paused
                state.currentTime = dom.currentTime
                state.duration = dom.duration
                dom.volume = state.volume
                dom.muted = state.muted
            }
        })

        watchGlobalKeyEvent(e => {
            if(e.key === " ") {
                playOrPause()
                e.preventDefault()
                e.stopPropagation()
            }else if((e.key === "ArrowLeft" || e.key === "ArrowRight") && e.metaKey) {
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
                   onDurationchange={durationChangeEvent} onTimeupdate={timeUpdateEvent}/>
            <VideoControls {...state} onPlayOrPause={playOrPause} onSeek={seek} onUpdateVolume={updateVolume} onUpdateMuted={updateMuted}/>
        </div>
    }
})

const VideoControls = defineComponent({
    props: {
        playing: Boolean,
        volume: {type: Number, required: true},
        muted: {type: Boolean, required: true},
        currentTime: {type: Number, required: true},
        duration: {type: Number, required: true}
    },
    emits: ["playOrPause", "seek", "updateVolume", "updateMuted"],
    setup(props, { emit }) {
        const playOrPause = () => emit("playOrPause")
        const seek = (positionTime: number) => emit("seek", positionTime)
        const updateVolume = (volume: number) => emit("updateVolume", volume)
        const updateMuted = (muted: boolean) => emit("updateMuted", muted)

        const { hover, mouseover, mouseleave } = useMouseHover()

        return () => <div class={{[style.controls]: true, [style.visible]: hover.value}} onMouseover={mouseover} onMouseleave={mouseleave}>
            {hover.value && <>
                <VideoProgressBar value={props.currentTime} max={props.duration} onSeek={seek}/>
                <VideoProgressSpan value={props.currentTime} max={props.duration}/>
                <VideoVolumeControl volume={props.volume} muted={props.muted} onUpdateVolume={updateVolume} onUpdateMuted={updateMuted}/>
                <div class={style.playButton} onClick={playOrPause}><i class={`fa fa-${props.playing ? "pause" : "play"}`}/></div>
            </>}
        </div>
    }
})

const VideoVolumeControl = defineComponent({
    props: {
        volume: {type: Number, required: true},
        muted: {type: Boolean, required: true}
    },
    emits: ["updateVolume", "updateMuted"],
    setup(props, { emit }) {
        const dom = ref<HTMLElement>()

        const updateVolume = (volume: number) => emit("updateVolume", volume)

        const switchMuted = () => emit("updateMuted", !props.muted)

        const { hover, mouseover, mouseleave} = useMouseHover()

        return () => <div ref={dom} class={{[style.volumeControl]: true, [style.visible]: hover.value}} onMouseover={mouseover} onMouseleave={mouseleave}>
            {hover.value && <>
                <div class={style.num}>{Math.round(props.volume * 100)}</div>
                <VideoVolumeBar value={props.volume} onUpdateValue={updateVolume}/>
            </>}
            <div class={style.icon} onClick={switchMuted}><i class={`fa fa-volume-${props.muted ? "mute" : props.volume >= 0.5 ? "up" : props.volume > 0 ? "down" : "off"}`}/></div>
        </div>
    }
})

const VideoVolumeBar = defineComponent({
    props: {
        value: {type: Number, required: true}
    },
    emits: ["updateValue"],
    setup(props, { emit }) {
        let isMousedown = false

        const updateValue = (e: MouseEvent) => {
            const seekValue = numbers.round2decimal(e.offsetX / (e.target as HTMLElement).offsetWidth)
            emit("updateValue", seekValue >= 0.97 ? 1 : seekValue <= 0.03 ? 0 : seekValue)
        }

        const mousedown = (e: MouseEvent) => {
            updateValue(e)
            document.addEventListener('mouseup', mouseup)
            isMousedown = true
        }

        const mousemove = (e: MouseEvent) => {
            if(isMousedown) {
                updateValue(e)
            }
        }

        const mouseup = () => {
            isMousedown = false
            document.removeEventListener('mouseup', mouseup)
        }

        onUnmounted(() => {
            document.removeEventListener('mouseup', mouseup)
        })

        return () => <div class={style.volumeBar} onMousedown={mousedown} onMousemove={mousemove}>
            <div class={style.progressing} style={`width: ${props.value * 100}%`}/>
            <div class={style.hiddenTriggerArea}/>
        </div>
    }
})

const VideoProgressBar = defineComponent({
    props: {
        value: {type: Number, required: true},
        max: {type: Number, required: true}
    },
    emits: ["seek"],
    setup(props, { emit }) {
        const percent = computed(() => !isNaN(props.max) && props.max !== Infinity ? (props.value * 100 / props.max).toFixed(3) : null)

        const click = (e: MouseEvent) => {
            if(!isNaN(props.max) && props.max !== Infinity) {
                const seekValue = props.max * e.offsetX / (e.target as HTMLElement).offsetWidth
                emit("seek", seekValue)
            }
        }

        return () => <div class={style.progressBar} onMousedown={click}>
            {percent.value !== null && <div class={style.progressing} style={`width: ${percent.value}%`}/>}
            <div class={style.hiddenTriggerArea}/>
        </div>
    }
})

const VideoProgressSpan = defineComponent({
    props: {
        value: {type: Number, required: true},
        max: {type: Number, required: true}
    },
    setup(props) {
        function toMinAndSec(value: number): string {
            const ten = (v: number) => v >= 10 ? v : `0${v}`
            const sec = Math.floor(value % 60), min = Math.floor(value / 60)
            return `${ten(min)}:${ten(sec)}`
        }

        const value = computed(() => toMinAndSec(props.value))
        const max = computed(() => toMinAndSec(props.max))

        return () => <div class={style.progressSpan}>
            {value.value} / {max.value}
        </div>
    }
})

interface State {
    playing: boolean,
    volume: number,
    muted: boolean,
    currentTime: number,
    duration: number
}

function usePlayControl(videoRef: Ref<HTMLMediaElement | undefined>, state: State) {
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
        state.currentTime = videoRef.value?.currentTime ?? NaN
    }

    const durationChangeEvent = () => {
        state.duration = videoRef.value!.duration
    }

    return {playOrPause, fastForward, fastRewind, seek, pausedEvent, playingEvent, timeUpdateEvent, durationChangeEvent}
}

function useVolumeControl(videoRef: Ref<HTMLMediaElement | undefined>, state: State) {
    const storage = useLocalStorageWithDefault("dashboard-video-volume", {volume: 1, muted: false})

    state.volume = storage.value.volume
    state.muted = storage.value.muted

    const updateVolume = (volume: number) => {
        state.volume = volume
    }

    const updateMuted = (muted: boolean) => {
        state.muted = muted
    }

    watch(() => state.volume, volume => {
        if(videoRef.value !== undefined) {
            videoRef.value.volume = volume
        }
    })

    watch(() => state.muted, muted => {
        if(videoRef.value !== undefined) {
            videoRef.value.muted = muted
        }
    })

    watch(() => ({volume: state.volume, muted: state.muted}), async (newStorage, old, onInvalidate) => {
        if(newStorage.volume !== old.volume || newStorage.muted !== old.muted) {
            //对volume状态的保存行为节流，延缓保存以减少执行次数
            let validate = true
            onInvalidate(() => validate = false)
            await sleep(1000)
            if(validate) {
                storage.value = newStorage
            }
        }
    })

    return {updateVolume, updateMuted}
}
