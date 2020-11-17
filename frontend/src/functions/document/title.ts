import { watch } from 'vue'
import { useRoute } from "vue-router"

export function useDocumentTitle() {
    const route = useRoute()
    watch(() => route.meta, meta => {
        document.title = meta.title ?? "Hedge"
    }, {immediate: true})
}