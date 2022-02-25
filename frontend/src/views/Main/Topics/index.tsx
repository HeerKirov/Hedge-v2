import { defineComponent } from "vue"
import LazyLoad from "@/components/logicals/LazyLoad"
import ListPanel from "./ListPanel"
import DetailPanel from "./DetailPanel/DetailPanel"
import CreatePanel from "./DetailPanel/CreatePanel"
import { installTopicContext } from "./inject"


export default defineComponent({
    setup() {
        const { createMode, detailMode } = installTopicContext()

        return () => <div>
            <LazyLoad visible={!createMode.value && !detailMode.value} v-slots={{
                default: show => <ListPanel v-show={show}/>
            }}/>
            {!!detailMode.value && <DetailPanel/>}
            {!!createMode.value && <CreatePanel/>}
        </div>
    }
})
