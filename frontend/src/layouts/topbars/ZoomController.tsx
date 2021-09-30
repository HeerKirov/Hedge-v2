import { computed, defineComponent, ref } from "vue"
import RangeInput from "@/components/forms/RangeInput"
import { watchGlobalKeyEvent } from "@/functions/feature/keyboard"
import { useDashboardZoom } from "@/layouts/data/Dashboard"
import { watchElementExcludeClick } from "@/functions/utils/element"
import { numbers } from "@/utils/primitives"
import style from "./ZoomController.module.scss"

const ZOOM_MIN = 20, ZOOM_MAX = 400, ZOOM_STEP = 20

export default defineComponent({
    setup() {
        const { zoom } = useDashboardZoom()

        const divRef = ref<HTMLElement>()
        watchElementExcludeClick(divRef, () => visible.value = false)

        const visible = ref(false)
        const open = () => visible.value = true
        const close = () => visible.value = false

        watchGlobalKeyEvent(e => {
            if(e.metaKey && (e.key === "-" || e.key === "=" || e.key === "0")) {
                if(e.key === "=") {
                    if(zoom.value < ZOOM_MAX) zoom.value += ZOOM_STEP
                }else if(e.key === "-") {
                    if(zoom.value > ZOOM_MIN) zoom.value -= ZOOM_STEP
                }else{
                    zoom.value = 100
                }
                e.preventDefault()
                e.stopPropagation()
            }
        })

        return () => <div ref={divRef} class={style.zoom}>
            <ZoomButton class="no-drag" onClick={open}/>
            {visible.value && <ZoomBar onClickButton={close}/>}
        </div>
    }
})

const ZoomButton = defineComponent({
    emits: ["click"],
    setup(_, { emit }) {
        const { zoom, enable } = useDashboardZoom()

        const click = () => emit("click")

        return () => <button class={[style.switchButton, "button", "is-white"]} disabled={!enable.value} onClick={click}>
            <span class="idp-icon"><i class="fa fa-eye"/></span>
            <b class={style.zoomValue}>x{numbers.round2decimal((zoom.value / 100))}</b>
        </button>
    }
})

const ZoomBar = defineComponent({
    emits: ["clickButton"],
    setup(_, { emit }) {
        const { zoom } = useDashboardZoom()

        const can = computed(() => ({minus: zoom.value > ZOOM_MIN, plus: zoom.value < ZOOM_MAX}))

        const clickButton = () => emit("clickButton")
        const update = (v: number) => zoom.value = v
        const minus = () => {
            if(can.value.minus) zoom.value -= ZOOM_STEP
        }
        const plus = () => {
            if(can.value.plus) zoom.value += ZOOM_STEP
        }


        return () => <div class={[style.zoomBar, "no-drag"]}>
            <button class={["button", "is-small", "is-white", style.smallButton]} onClick={minus} disabled={!can.value.minus}>
                <i class="fa fa-minus"/>
            </button>
            <RangeInput max={ZOOM_MAX} min={ZOOM_MIN} step={ZOOM_STEP} value={zoom.value} onUpdateValue={update} refreshOnInput={true}/>
            <button class={["button", "is-small", "is-white", style.smallButton]} onClick={plus} disabled={!can.value.plus}>
                <i class="fa fa-plus"/>
            </button>
            <ZoomButton onClick={clickButton}/>
        </div>
    }
})

