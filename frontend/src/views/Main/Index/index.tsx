import { defineComponent, ref } from "vue"
import TopBarLayout from "@/layouts/TopBarLayout"
import VirtualGrid from "@/layouts/VirtualScrollView/VirtualGrid"

export default defineComponent({
    setup() {
        const data = ref<{limit: number, offset: number, total: number | undefined, data: string[]}>({limit: 0, offset: 0, total: undefined, data: []})

        const dataUpdate = async (offset: number, limit: number) => {
            const r = await mockData(offset, limit)
            data.value = {offset, limit: r.data.length, total: r.total, data: r.data}
        }

        return () => <div>
            <TopBarLayout v-slots={{
                topBar: () => <span>hello</span>,
                default: () => <div class="w-100 h-100">
                    <VirtualGrid onUpdate={dataUpdate} columnCount={6} buffer={450}
                                 total={data.value.total} limit={data.value.limit} offset={data.value.offset}>
                        {console.log(`render ${data.value.data.length} item`)}
                        {data.value.data.map(item => <div style="width: 16.666666667%; aspect-ratio: 1">
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