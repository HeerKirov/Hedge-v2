import { defineComponent } from "vue"
import TopBarLayout from "@/layouts/TopBarLayout"
import SplitPane from "@/layouts/SplitPane"
import TopBarContent from "./ListPanel/TopBarContent"
import ListView from "./ListPanel/ListView"
import ListPanel from "./ListPanel"
import { installTopicContext } from "./inject"


export default defineComponent({
    setup() {
        const context = installTopicContext()

        const { createMode, detailMode } = context

        //TODO 确定使用detail panel。通过单击title进入。
        return () => <div>
            <ListPanel/>
        </div>
    }
})