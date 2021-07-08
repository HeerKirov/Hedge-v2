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
                <button class="square button is-white" onClick={viewStacks.goBack}><span class="icon"><i class="fa fa-arrow-left"/></span></button>
            </div>
            <div class="layout-container">
                {/* test zoom */}
                <NumberInput value={zoom.value * 100} onUpdateValue={v => zoom.value = v / 100}/>
            </div>
            <div class="layout-container">
                <button class="square button is-white" onClick={navigator.prevWholeIllust}><span class="icon"><i class="fa fa-angle-double-left"/></span></button>
                <button class="square button is-white" onClick={navigator.prev}><span class="icon"><i class="fa fa-angle-left"/></span></button>
                {navigator.metrics.value.current + 1}/{navigator.metrics.value.total}
                {navigator.metricsOfCollection.value && <span>
                    ({navigator.metricsOfCollection.value.current + 1}/{navigator.metricsOfCollection.value.total})
                </span>}
                <button class="square button is-white" onClick={navigator.next}><span class="icon"><i class="fa fa-angle-right"/></span></button>
                <button class="square button is-white" onClick={navigator.nextWholeIllust}><span class="icon"><i class="fa fa-angle-double-right"/></span></button>
            </div>
        </div>
    }
})
