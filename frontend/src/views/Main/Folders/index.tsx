import { defineComponent } from "vue"
import LazyLoad from "@/components/features/LazyLoad"
import ListPanel from "./ListPanel"
import DetailPanel from "./DetailPanel"
import { installFolderContext } from "./inject"

export default defineComponent({
    setup() {
        const { view } = installFolderContext()

        return () => <>
            <LazyLoad visible={true} v-slots={{
                default: show => <ListPanel v-show={show}/>
            }}/>
            {!!view.detailView.value && <DetailPanel/>}
        </>
    }
})
