import { defineComponent } from "vue"
import LazyLoad from "@/components/LazyLoad"
import ListPanel from "./ListPanel"
import DetailPanel from "./DetailPanel"
import { installTopicContext } from "./inject"


export default defineComponent({
    setup() {
        const { createMode, detailMode } = installTopicContext()

        return () => <div>
            <LazyLoad visible={!createMode.value && !detailMode.value} v-slots={{
                default: show => <ListPanel v-show={show}/>
            }}/>
            <LazyLoad visible={!!detailMode.value} v-slots={{
                default: show => <DetailPanel v-show={show}/>
            }}/>
        </div>
    }
})