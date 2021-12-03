import { computed, defineComponent, PropType } from "vue"
import TopBarLayout from "@/layouts/layouts/TopBarLayout"
import { ExpandArea } from "@/layouts/topbars/Query"
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
        const { querySchema: { expanded, schema } } = installIllustContext(partition, closePartition)

        const topBarLayoutSlots = {
            topBar: () => <TopBarContent/>,
            default: () => <ListView/>,
            expand: () => schema.value && <ExpandArea schema={schema.value}/>,
        }
        return () => <TopBarLayout v-slots={topBarLayoutSlots} expanded={expanded.value} onUpdateExpanded={v => expanded.value = v}/>
    }
})
