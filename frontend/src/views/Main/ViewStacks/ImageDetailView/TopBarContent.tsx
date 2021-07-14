import { computed, defineComponent, inject } from "vue"
import { dashboardZoomInjection } from "@/components/features/Dashboard"
import { ImageUpdateForm } from "@/functions/adapter-http/impl/illust"
import { watchGlobalKeyEvent } from "@/functions/document/global-key"
import { useFastObjectEndpoint } from "@/functions/utils/endpoints/object-fast-endpoint"
import { useDetailViewContext } from "./inject"
import { BackspaceButton } from ".."
import style from "./style.module.scss"

export default defineComponent({
    setup() {
        const { zoom } = inject(dashboardZoomInjection)!

        return () => <div class={["middle-layout", style.topBarContent]}>
            <div class="layout-container">
                <BackspaceButton/>
            </div>
            <div class="layout-container">
                <Navigator/>
            </div>
            <div class="layout-container">
                <FavoriteButton/>
                <button class="square button is-white no-drag"><span class="icon"><i class="fa fa-external-link-alt"/></span></button>
                <button class="square button is-white no-drag"><span class="icon"><i class="fa fa-eye"/></span></button>
                <button class="square button is-white no-drag"><span class="icon"><i class="fa fa-ellipsis-v"/></span></button>
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
                }else if(e.metaKey) {
                    navigator.prevWholeIllust()
                }else{
                    navigator.prev()
                }
                e.stopPropagation()
                e.preventDefault()
            }else if(e.key === "ArrowRight" || e.key === "ArrowDown") {
                if(e.shiftKey) {
                    navigator.nextWholeIllust(5)
                }else if(e.metaKey) {
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
