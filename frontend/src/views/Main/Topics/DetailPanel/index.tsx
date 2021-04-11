import { defineComponent } from "vue"
import TopBarTransparentLayout from "@/layouts/TopBarTransparentLayout"
import TopBarContent from "./TopBarContent"
import DetailView from "./DetailView"
import { installTopicDetailContext } from "./inject"

export default defineComponent(function() {
    installTopicDetailContext()

    return () => <TopBarTransparentLayout paddingForTopBar={true} scrollable={true} v-slots={{
        topBar: () => <TopBarContent/>,
        default: () => <DetailView/>
    }}/>
})