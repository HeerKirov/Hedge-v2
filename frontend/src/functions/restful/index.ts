import { onMounted, ref, Ref, watch, toRaw } from "vue"
import { HttpClient, Response } from "@/functions/adapter-http"
import { useHttpClient } from "@/functions/service"
import { useNotification } from "@/functions/notification"

/* 此处提供了VCA形态的rest api端点调用器。目标是处理符合标准object模型的对象。
    应对简单和复杂的rest endpoint，有两种更新模型。
    简单模型：直接修改data，响应式更改。data的update form和它的response基本一致。
    负责模型：调用update函数，发送专门的更改通知。自动发起更改，并请求最新的值。
*/

/**
 * 简单模型：响应式endpoint。
 */
interface ReactiveEndpoint<T> {
    loading: Readonly<Ref<boolean>>
    updateLoading: Readonly<Ref<boolean>>
    data: Ref<T | undefined>
}

interface ReactiveEndpointOptions<T> {
    get(httpClient: HttpClient): () => Promise<Response<T>>
    update(httpClient: HttpClient): (form: T) => Promise<Response<unknown>>
}

export function useReactiveEndpoint<T>(options: ReactiveEndpointOptions<T>): ReactiveEndpoint<T> {
    const httpClient = useHttpClient()
    const notification = useNotification()

    const loading = ref(true)
    const updateLoading = ref(false)
    const data = ref<T>()

    onMounted(async () => {
        const res = await options.get(httpClient)()
        if(res.ok) {
            data.value = res.data
        }
        loading.value = false
    })

    watch(data, async (_, o) => {
        if(o !== undefined && data.value !== undefined) {
            updateLoading.value = true
            const res = await options.update(httpClient)(toRaw(data.value))
            if(!res.ok && res.exception) {
                notification.notify(`${res.exception.status}: ${res.exception.code}`, "danger", res.exception.message)
            }
            updateLoading.value = false
        }
    }, {deep: true})

    return {loading, updateLoading, data}
}
