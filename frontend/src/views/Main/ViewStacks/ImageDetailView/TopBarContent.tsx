import { computed, defineComponent, inject, ref } from "vue"
import { dashboardZoomInjection, getDashboardType } from "@/layouts/data/Dashboard"
import { ImageUpdateForm } from "@/functions/adapter-http/impl/illust"
import { useElementPopupMenu } from "@/functions/module"
import { watchGlobalKeyEvent } from "@/functions/document/global-key"
import { useFastObjectEndpoint } from "@/functions/utils/endpoints/object-fast-endpoint"
import { watchElementExcludeClick } from "@/functions/utils/element"
import { numbers } from "@/utils/primitives"
import { useDetailViewContext } from "./inject"
import { BackspaceButton } from ".."
import style from "./style.module.scss"

export default defineComponent({
    setup() {
        return () => <div class={["middle-layout", style.topBarContent]}>
            <div class="layout-container">
                <BackspaceButton/>
            </div>
            <div class="layout-container">
                <Navigator/>
            </div>
            <div class="layout-container">
                <FavoriteButton/>
                <ExternalButton/>
                <ZoomButton/>
            </div>
        </div>
    }
})

const Navigator = defineComponent({
    setup() {
        const { navigator } = useDetailViewContext()

        watchGlobalKeyEvent(e => {
            if(e.key === "ArrowLeft" || e.key === "ArrowUp") {
                if(e.shiftKey) {
                    navigator.prevWholeIllust(5)
                }else if(e.altKey) {
                    navigator.prevWholeIllust()
                }else{
                    navigator.prev()
                }
                e.stopPropagation()
                e.preventDefault()
            }else if(e.key === "ArrowRight" || e.key === "ArrowDown") {
                if(e.shiftKey) {
                    navigator.nextWholeIllust(5)
                }else if(e.altKey) {
                    navigator.nextWholeIllust()
                }else{
                    navigator.next()
                }
                e.stopPropagation()
                e.preventDefault()
            }
        })

        return () => <>
            <button class="square button is-white no-drag" onClick={navigator.prev}><span class="icon"><i class="fa fa-angle-left"/></span></button>
            <span class={["no-drag", style.navigatorContent]}>
                {navigator.metrics.value.current + 1} / {navigator.metrics.value.total}
                {navigator.metricsOfCollection.value && <p class="is-size-small has-text-grey">
                    {navigator.metricsOfCollection.value.current + 1} / {navigator.metricsOfCollection.value.total}
                </p>}
            </span>
            <button class="square button is-white no-drag" onClick={navigator.next}><span class="icon"><i class="fa fa-angle-right"/></span></button>
        </>
    }
})

const FavoriteButton = defineComponent({
    setup() {
        const { detail: { target } } = useDetailViewContext()

        const { setData } = useFastObjectEndpoint<number, unknown, ImageUpdateForm>({
            update: httpClient => httpClient.illust.image.update
        })

        const favorite = computed(() => target.value?.favorite ?? null)

        const click = async () => {
            if(target.value !== null) {
                const newFavoriteValue = !favorite.value
                const ok = await setData(target.value.id, {favorite: newFavoriteValue})
                if(ok) {
                    target.value.favorite = newFavoriteValue
                }
            }
        }

        return () => <button class="square button is-white no-drag" onClick={click}>
            <span class={`icon has-text-${favorite.value ? "danger" : "grey"}`}><i class="fa fa-heart"/></span>
        </button>
    }
})

const ExternalButton = defineComponent({
    setup() {
        const menu = useElementPopupMenu([
            {type: "normal", label: "在新窗口中打开"},
            {type: "separator"},
            {type: "normal", label: "在预览中打开"},
            {type: "normal", label: "在访达中显示"},
            {type: "separator"},
            {type: "normal", label: "导出"}
        ], {position: "bottom", offsetY: 6})

        return () => <button ref={menu.element} class="square button is-white no-drag" onClick={() => menu.popup()}><span class="icon"><i class="fa fa-external-link-alt"/></span></button>
    }
})

const ZOOM_MIN = 20, ZOOM_MAX = 400, ZOOM_STEP = 20

const ZoomButton = defineComponent({
    setup() {
        const { zoom } = inject(dashboardZoomInjection)!
        const { detail: { target } } = useDetailViewContext()

        const divRef = ref<HTMLElement>()

        const visible = ref(false)

        const click = () => visible.value = !visible.value

        watchElementExcludeClick(divRef, () => visible.value = false)

        const disabled = computed(() => target.value !== null ? getDashboardType(target.value.file) !== "Image" : false)

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
            {visible.value && <div class={style.zoomBar}>
                <ZoomBar/>
            </div>}
            <button class="button is-white no-drag" disabled={disabled.value} onClick={click}>
                <span class="idp-icon"><i class="fa fa-eye"/></span>
                <b class={style.zoomValue}>x{numbers.round2decimal((zoom.value / 100))}</b>
            </button>
        </div>
    }
})

const ZoomBar = defineComponent({
    setup() {
        const { zoom } = inject(dashboardZoomInjection)!

        const can = computed(() => ({minus: zoom.value > ZOOM_MIN, plus: zoom.value < ZOOM_MAX}))

        const minus = () => {
            if(can.value.minus) {
                zoom.value -= ZOOM_STEP
            }
        }
        const plus = () => {
            if(can.value.plus) {
                zoom.value += ZOOM_STEP
            }
        }

        return () => <>
            <button class="square button is-white" disabled={!can.value.minus} onClick={minus}><span class="icon"><i class="fa fa-minus"/></span></button>
            <span class={style.number}>{zoom.value}%</span>
            <button class="square button is-white" disabled={!can.value.plus} onClick={plus}><span class="icon"><i class="fa fa-plus"/></span></button>
        </>
    }
})

