import { computed, defineComponent, onMounted, ref } from "vue"
import TopBarLayout from "@/layouts/TopBarLayout"
import VirtualGrid, { useScrollView } from "@/layouts/VirtualScrollView/VirtualGrid"
import NumberInput from "@/components/NumberInput"

export default defineComponent({
    setup() {
        const data = ref<{limit: number, offset: number, total: number | undefined, data: string[]}>({limit: 0, offset: 0, total: undefined, data: []})

        const dataUpdate = async (offset: number, limit: number) => {
            const r = await mockData(offset, limit)
            data.value = {offset, limit: r.data.length, total: r.total, data: r.data}
        }

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
                        <NumberInput class="is-small is-width-half" value={view.state.itemOffset} onUpdateValue={v => view.navigateTo(v)}/><span class="mr-1">/</span><span class="tag">{data.value.total}</span>
                    </div>
                </div>,
                default: () => <div class="w-100 h-100">
                    <VirtualGrid onUpdate={dataUpdate} columnCount={columnCount.value} buffer={450} minUpdateDelta={1}
                                 total={data.value.total} limit={data.value.limit} offset={data.value.offset}>
                        {data.value.data.map(item => <div style={`aspect-ratio: 1; width: ${columnWidthStyle.value}`}>
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

function mockData(offset: number, limit: number): Promise<{total: number, data: string[]}> {
    return new Promise(resolve => {
        setTimeout(() => resolve({total: mockedTotal, data: mockedData.slice(offset, limit + offset)}), 20)
    })
}