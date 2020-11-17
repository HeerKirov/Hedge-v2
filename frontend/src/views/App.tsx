import { defineComponent } from "vue"
import { RouterView } from "vue-router"
import { useDocumentTitle } from '@/functions/document/title'

export default defineComponent(() => {
    useDocumentTitle()

    return () => <RouterView/>
})