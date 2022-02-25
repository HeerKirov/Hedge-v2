import { computed, defineComponent, PropType } from "vue"
import TopBarLayout from "@/components/layouts/TopBarLayout"
import SplitPane from "@/components/layouts/SplitPane"
import { IllustPaneDetail } from "@/layouts/data/DatasetView"
import { ExpandArea } from "@/layouts/topbars/Query"
import { DetailIllust } from "@/functions/adapter-http/impl/illust"
import { LocalDate } from "@/utils/datetime"
import TopBarContent from "./TopBarContent"
import ListView from "./ListView"
import { installIllustContext } from "./inject"

export default defineComponent({
    props: {
        partitionTime: Object as PropType<LocalDate>
    },
    emits: {
        partitionClose: () => true
    },
    setup(props, { emit }) {
        const partition = props.partitionTime !== undefined ? computed(() => props.partitionTime!) : null
        const closePartition = props.partitionTime !== undefined ? () => emit("partitionClose") : undefined
        const { dataView, endpoint, querySchema: { expanded, schema }, pane } = installIllustContext(partition, closePartition)

        const closePane = () => pane.visible.value = false
        const onRefreshEndpoint = () => endpoint.refresh
        const onAfterUpdate = (id: number, data: DetailIllust) => {
            const index = dataView.proxy.syncOperations.find(i => i.id === id)
            if(index != undefined) dataView.proxy.syncOperations.modify(index, data)
        }

        const topBarLayoutSlots = {
            topBar: () => <TopBarContent/>,
            expand: () => schema.value && <ExpandArea schema={schema.value}/>,
            default: () => <SplitPane showPane={pane.visible.value} v-slots={{
                default: () => <ListView/>,
                pane: () => <IllustPaneDetail state={pane.state.value} onClose={closePane} onAfterUpdate={onAfterUpdate} onRefreshEndpoint={onRefreshEndpoint}/>
            }}/>
        }
        return () => <TopBarLayout v-slots={topBarLayoutSlots} expanded={expanded.value} onUpdateExpanded={v => expanded.value = v}/>
    }
})
