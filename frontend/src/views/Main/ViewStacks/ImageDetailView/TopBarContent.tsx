import { defineComponent, inject } from "vue"
import NumberInput from "@/components/forms/NumberInput"
import { dashboardZoomInjection } from "@/components/features/Dashboard"
import { useViewStacks } from "../../ViewStacks"
import { useDetailViewContext } from "./inject"

export default defineComponent({
    setup() {
        const viewStacks = useViewStacks()

        const { navigator } = useDetailViewContext()

        const { zoom } = inject(dashboardZoomInjection)!

        return () => <div class="middle-layout">
            <div class="layout-container">
                <button class="square button is-white no-drag" onClick={viewStacks.goBack}><span class="icon"><i class="fa fa-arrow-left"/></span></button>
            </div>
            <div class="layout-container">
                {/* test zoom */}
                <NumberInput class="no-drag" value={zoom.value * 100} onUpdateValue={v => zoom.value = v / 100}/>
            </div>
            <div class="layout-container">
                <button class="square button is-white no-drag" onClick={navigator.prevWholeIllust}><span class="icon"><i class="fa fa-angle-double-left"/></span></button>
                <button class="square button is-white no-drag" onClick={navigator.prev}><span class="icon"><i class="fa fa-angle-left"/></span></button>
                <span class="no-drag">
                    {navigator.metrics.value.current + 1}/{navigator.metrics.value.total}
                    {navigator.metricsOfCollection.value && <span>
                        ({navigator.metricsOfCollection.value.current + 1}/{navigator.metricsOfCollection.value.total})
                    </span>}
                </span>
                <button class="square button is-white no-drag" onClick={navigator.next}><span class="icon"><i class="fa fa-angle-right"/></span></button>
                <button class="square button is-white no-drag" onClick={navigator.nextWholeIllust}><span class="icon"><i class="fa fa-angle-double-right"/></span></button>
                <button class="square button is-white no-drag"><span class="icon has-text-danger"><i class="fa fa-heart"/></span></button>
                <button class="square button is-white no-drag"><span class="icon"><i class="fa fa-external-link-alt"/></span></button>
                <button class="square button is-white no-drag"><span class="icon"><i class="fa fa-eye"/></span></button>
                <button class="square button is-white no-drag"><span class="icon"><i class="fa fa-ellipsis-v"/></span></button>
            </div>
        </div>
    }
})
