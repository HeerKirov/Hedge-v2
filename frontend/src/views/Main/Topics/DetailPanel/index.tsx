import { defineComponent } from "vue"
import TopBarTransparentLayout from "@/layouts/TopBarTransparentLayout"
import TopBarContent from "./TopBarContent"
import DetailView from "./DetailView"

export default defineComponent(function() {
    return () => <TopBarTransparentLayout paddingForTopBar={true} scrollable={true} v-slots={{
        topBar: () => <TopBarContent/>,
        default: () => <DetailView/>
    }}/>
})