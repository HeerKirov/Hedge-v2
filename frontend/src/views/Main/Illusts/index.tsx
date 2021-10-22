import { computed, defineComponent, PropType } from "vue"
import TopBarLayout from "@/layouts/layouts/TopBarLayout"
import { CreatingCollectionDialog, installCreatingCollectionDialog } from "@/layouts/dialogs/CreatingCollectionDialog"
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
        const partitionClose = props.partitionTime !== undefined ? () => emit("partitionClose") : undefined
        installIllustContext(partition, partitionClose)
        installCreatingCollectionDialog()

        const topBarLayoutSlots = {
            topBar: () => <TopBarContent/>,
            default: () => <ListView/>
        }
        return () => <>
            <TopBarLayout v-slots={topBarLayoutSlots}/>
            <CreatingCollectionDialog/>
        </>
    }
})
