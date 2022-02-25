import { onMounted, readonly, ref } from "vue"
import { ipc } from "@/functions/adapter-ipc"


export function useWebAccessUrls() {
    const urls = ref<string[]>([])

    onMounted(async () => urls.value = await ipc.server.webAccessUrls())

    return readonly(urls)
}
