import { defineComponent } from "vue"
import DetailView from "./DetailView"
import EditView from "./EditView"
import { installAuthorDetailContext } from "./inject"

export default defineComponent(function() {
    const { editMode } = installAuthorDetailContext()

    return () => editMode.value ? <EditView/> : <DetailView/>
})
