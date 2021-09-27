import { computed, reactive, readonly, ref, watch } from "vue"
import { HttpClient, Response } from "@/functions/adapter-http"
import { ListResult } from "@/functions/adapter-http/impl/generic"
import { useContinuousEndpoint } from "@/functions/utils/endpoints/continuous-endpoint"
import { useToast, ToastManager } from "@/functions/module/toast"
import { useHttpClient } from "@/functions/app"
import { installation } from "@/functions/utils/basic"

export type SearchRequestFunction = (client: HttpClient, offset: number, limit: number, search: string) => Promise<Response<ListResult<any>>>

export interface SearchResultAttachItem {
    key: string
    title: string | ((search: string) => string)
    icon?: string
    click?(configuration: {search: string, pick(v: any): void, httpClient: HttpClient, handleException: ToastManager["handleException"]}): void
}

interface DataOptions {
    initSize: number
    continueSize: number
    request: SearchRequestFunction
}

export const [installData, useData] = installation(function({ initSize, continueSize, request } : DataOptions) {
    const httpClient = useHttpClient()
    const { handleError, handleException } = useToast()

    const search = ref("")
    const updateSearch = (text: string) => {
        if(search.value !== text) {
            search.value = text
            return true
        }
        return false
    }

    const endpoint = useContinuousEndpoint({
        request: (offset, limit) => request(httpClient, offset, limit, search.value),
        handleError,
        initSize,
        continueSize
    })

    //什么情况下显示或不显示more按钮？
    //  初次加载，也就是loading && total === 0时，不显示
    //  确定没有新数据，也就是!loading && total <= result.length时，不显示
    //  其余情况应该都是显示的，但loading时不响应触发
    const showMore = computed(() =>
        (endpoint.loading.value || endpoint.data.value.total > endpoint.data.value.result.length) &&
        (!endpoint.loading.value || endpoint.data.value.total > 0))

    const searchData = reactive({...endpoint, showMore})

    const contentType = ref<"recent" | "search">("recent")

    watch(search, value => {
        if(value.length) {
            //有搜索内容时执行搜索
            contentType.value = "search"
            endpoint.refresh()
        }else{
            //无搜索内容时切换至recent
            contentType.value = "recent"
            endpoint.clear()
        }
    })

    return {updateSearch, contentType, searchData, search: readonly(search), httpClient, handleException}
})
