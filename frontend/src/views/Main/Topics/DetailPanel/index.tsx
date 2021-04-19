import { defineComponent } from "vue"
import DetailView from "./DetailView"
import EditView from "./EditView"
import { installTopicDetailContext } from "./inject"

export default defineComponent(function() {
    const { editMode } = installTopicDetailContext()

    return () => editMode.value ? <EditView/> : <DetailView/>
})
