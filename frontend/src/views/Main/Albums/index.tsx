import { defineComponent } from "vue"
import { ExpandArea } from "@/layouts/topbars/Query"
import TopBarLayout from "@/components/layouts/TopBarLayout"
import TopBarContent from "./TopBarContent"
import ListView from "./ListView"
import { installAlbumContext } from "./inject"

export default defineComponent({
    setup() {
        const { querySchema: { expanded, schema } } = installAlbumContext()

        const topBarLayoutSlots = {
            topBar: () => <TopBarContent/>,
            default: () => <ListView/>,
            expand: () => schema.value && <ExpandArea schema={schema.value}/>,
        }
        return () => <TopBarLayout v-slots={topBarLayoutSlots} expanded={expanded.value} onUpdateExpanded={v => expanded.value = v}/>
    }
})
