import { watch } from "vue"
import { useRoute } from "vue-router"

/**
 * 提供一个标题变更watcher。根据route.meta.title变更当前的document标题。
 */
export function installTitleWatcher() {
    const route = useRoute()
    watch(() => route.meta, meta => {
        document.title = meta.title ?? "Hedge"
    }, {immediate: true})
}