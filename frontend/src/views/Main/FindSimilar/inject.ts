import {
    PaginationDataView, QueryEndpointResult,
    usePaginationDataView, useQueryEndpoint } from "@/functions/utils/endpoints/query-endpoint"
import { FindSimilarResult } from "@/functions/adapter-http/impl/find-similar"
import { ScrollView, useScrollView } from "@/components/features/VirtualScrollView"
import { useHttpClient } from "@/functions/app"
import { useToast } from "@/functions/module/toast"
import { installation } from "@/functions/utils/basic"


export interface FindSimilarContext {
    list: {
        dataView: PaginationDataView<FindSimilarResult>
        endpoint: QueryEndpointResult<FindSimilarResult>
        scrollView: Readonly<ScrollView>
    }
}

export const [installFindSimilarContext, useFindSimilarContext] = installation(function (): FindSimilarContext {
    const list = useListContext()

    return {list}})

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
