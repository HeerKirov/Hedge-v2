import { onMounted, ref, Ref, watch, toRaw } from "vue"
import { HttpClient, Response } from "@/functions/adapter-http"
import { BasicException } from "@/functions/adapter-http/exception"
import { useHttpClient } from "@/services/app"
import { useToast } from "@/services/module/toast"

/* 此处提供了VCA形态的rest api端点调用器。目标是处理符合标准object模型的对象。
    它的目标是处理简单模型，即整个rest api可被描述为简单的object模型的api。
    这类模型将被抽象为可读写的Ref对象。
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
    get(httpClient: HttpClient): () => Promise<Response<T, BasicException>>
    update(httpClient: HttpClient): (form: T) => Promise<Response<unknown, BasicException>>
}

export function useReactiveEndpoint<T>(options: ReactiveEndpointOptions<T>): ReactiveEndpoint<T> {
    const httpClient = useHttpClient()
    const toast = useToast()

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
                toast.handleException(res.exception)
            }
            updateLoading.value = false
        }
    }, {deep: true})

    return {loading, updateLoading, data}
}
