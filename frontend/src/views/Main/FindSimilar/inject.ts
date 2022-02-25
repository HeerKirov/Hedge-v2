import {
    PaginationDataView, QueryEndpointResult,
    usePaginationDataView, useQueryEndpoint } from "@/functions/endpoints/query-endpoint"
import { FindSimilarResult } from "@/functions/adapter-http/impl/find-similar"
import { ScrollView, useScrollView } from "@/components/logicals/VirtualScrollView"
import { useHttpClient } from "@/services/app"
import { useToast } from "@/services/module/toast"
import { installation } from "@/functions/utils/basic"
import { ref, Ref } from "vue";

export interface FindSimilarContext {
    list: {
        dataView: PaginationDataView<FindSimilarResult>
        endpoint: QueryEndpointResult<FindSimilarResult>
        scrollView: Readonly<ScrollView>
    }
    pane: {
        detailMode: Readonly<Ref<number | null>>
        openDetailPane(id: number)
        closePane()
    }
}

export const [installFindSimilarContext, useFindSimilarContext] = installation(function (): FindSimilarContext {
    const list = useListContext()

    const pane = usePane()

    return {list, pane}
})

function useListContext() {
    const { handleError } = useToast()
    const httpClient = useHttpClient()
    const scrollView = useScrollView()

    const endpoint = useQueryEndpoint({
        request: (offset, limit) => httpClient.findSimilar.result.list({offset, limit, order: "-orderedId"}),
        handleError
    })
    const dataView = usePaginationDataView(endpoint)

    return {endpoint, dataView, scrollView}
}

function usePane() {
    const detailMode = ref<number | null>(null)

    const openDetailPane = (id: number) => detailMode.value = id

    const closePane = () => detailMode.value = null

    return {detailMode, openDetailPane, closePane}
}
