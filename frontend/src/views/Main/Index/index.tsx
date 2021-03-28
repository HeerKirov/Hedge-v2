import { computed, defineComponent, ref } from "vue"
import TopBarLayout from "@/layouts/TopBarLayout"
import NumberInput from "@/components/NumberInput"
import { VirtualGrid, useScrollView } from "@/components/VirtualScrollView"
import { useDataEndpoint } from "@/functions/utils/data-endpoint"

export default defineComponent({
    setup() {
        const { data, dataUpdate } = useDataEndpoint({
            segmentSize: 100,
            queryDelay: 250,
            async request(offset: number, limit: number) {
                return {
                    ok: true,
                    total: mockedTotal,
                    result: mockedData.slice(offset, offset + limit)
                }
            }
        })

        const view = useScrollView()
        const columnCount = ref(6)
        const columnWidthStyle = computed(() => `${100 / columnCount.value}%`)

        return () => <div>
            <TopBarLayout v-slots={{
                topBar: () => <div class="middle-layout">
                    <div class="left no-drag">
                        <NumberInput class="is-small is-width-half" value={columnCount.value} onUpdateValue={v => columnCount.value = v}/>
                    </div>
                    <div class="right single-line-group no-drag">
                        <NumberInput class="is-small is-width-half" value={view.state.itemOffset} onUpdateValue={v => view.navigateTo(v)}/><span class="mr-1">/</span><span class="tag">{data.value.metrics.total}</span>
                    </div>
                </div>,
                default: () => <div class="w-100 h-100">
                    <VirtualGrid onUpdate={dataUpdate} columnCount={columnCount.value} bufferSize={6} minUpdateDelta={2}
                                 total={data.value.metrics.total} limit={data.value.metrics.limit} offset={data.value.metrics.offset}>
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