import { computed, defineComponent } from "vue"
import { ZoomController } from "@/layouts/topbar-components"
import { ImageUpdateForm } from "@/functions/adapter-http/impl/illust"
import { useElementPopupMenu } from "@/functions/module"
import { watchGlobalKeyEvent } from "@/functions/document/global-key"
import { useFastObjectEndpoint } from "@/functions/utils/endpoints/object-fast-endpoint"
import { BackspaceButton } from ".."
import { useDetailViewContext } from "./inject"
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
                <ZoomController/>
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
        const { detail: { target, setTargetData } } = useDetailViewContext()

        const { setData } = useFastObjectEndpoint<number, unknown, ImageUpdateForm>({
            update: httpClient => httpClient.illust.image.update
        })

        const favorite = computed(() => target.value?.favorite ?? null)

        const click = async () => {
            if(target.value !== null) {
                const newFavoriteValue = !favorite.value
                const ok = await setData(target.value.id, {favorite: newFavoriteValue})
                if(ok) {
                    setTargetData({...target.value, favorite: newFavoriteValue})
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

