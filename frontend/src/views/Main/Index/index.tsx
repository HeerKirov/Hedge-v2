import { computed, defineComponent, ref } from "vue"
import NumberInput from "@/components/forms/NumberInput"
import TopBarLayout from "@/layouts/layouts/TopBarLayout"
import { DataRouter } from "@/layouts/topbar-components"
import { VirtualGrid, useScrollView } from "@/components/features/VirtualScrollView"
import { usePaginationDataView, useQueryEndpoint } from "@/functions/utils/endpoints/query-endpoint"

export default defineComponent({
    setup() {
        const queryEndpoint = useQueryEndpoint({
            async request(offset: number, limit: number) {
                return {
                    ok: true,
                    total: mockedTotal,
                    result: mockedData.slice(offset, offset + limit)
                }
            }
        })
        const { data, dataUpdate } = usePaginationDataView(queryEndpoint)

        useScrollView()
        const columnCount = ref(5)
        const columnWidthStyle = computed(() => `${100 / columnCount.value}%`)

        return () => <div>
            <TopBarLayout v-slots={{
                topBar: () => <div class="middle-layout">
                    <div class="layout-container no-drag">
                        <NumberInput class="is-small is-width-half" value={columnCount.value} onUpdateValue={v => columnCount.value = v}/>
                    </div>
                    <div class="layout-container no-drag">
                        <DataRouter/>
                    </div>
                </div>,
                default: () => <div class="w-100 h-100">
                    <VirtualGrid onUpdate={dataUpdate} columnCount={columnCount.value} bufferSize={6} minUpdateDelta={2} {...data.value.metrics}>
                        {data.value.result.map(item => <div key={item} style={`aspect-ratio: 1; width: ${columnWidthStyle.value}`}>
                            <div class="box mr-1 w-100 h-100">{item}</div>
                        </div>)}
                    </VirtualGrid>
                </div>
            }}/>
        </div>
    }
})

const mockedTotal = 200
const mockedData: string[] = Array(mockedTotal).fill(0).map((_, i) => `item ${i}`)
