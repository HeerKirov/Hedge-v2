import { defineComponent } from "vue"
import TopBarTransparentLayout from "@/layouts/layouts/TopBarTransparentLayout"
import TopBarContent from "./TopBarContent"
import DetailView from "./DetailView"
import EditView from "./EditView"
import { installTopicDetailContext } from "./inject"

export default defineComponent(function() {
    const { editor } = installTopicDetailContext()

    return () => <TopBarTransparentLayout paddingForTopBar={true} scrollable={true} v-slots={{
        topBar: () => <TopBarContent/>,
        default: () => editor.editMode.value ? <EditView/> : <DetailView/>
    }}/>
})
