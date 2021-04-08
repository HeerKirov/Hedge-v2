import { defineComponent } from "vue"
import TopBarLayout from "@/layouts/TopBarLayout"
import TopBarContent from "./TopBarContent"
import DetailView from "./DetailView"

export default defineComponent(function() {
    return () => <TopBarLayout v-slots={{
        topBar: () => <TopBarContent/>,
        default: () => <DetailView/>
    }}/>
})