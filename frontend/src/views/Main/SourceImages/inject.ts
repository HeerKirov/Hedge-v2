import { readonly, ref, Ref } from "vue"
import { ScrollView, useScrollView } from "@/components/features/VirtualScrollView"
import { PaginationDataView, QueryEndpointResult, usePaginationDataView, useQueryEndpoint } from "@/functions/utils/endpoints/query-endpoint"
import { SourceImage, SourceImageQueryFilter } from "@/functions/adapter-http/impl/source-image"
import { installation } from "@/functions/utils/basic"
import { useHttpClient } from "@/functions/app"
import { useToast } from "@/functions/module/toast"

export interface SourceImageContext {
    list: {
        endpoint: QueryEndpointResult<SourceImage>
        dataView: PaginationDataView<SourceImage>
        scrollView: Readonly<ScrollView>
        queryFilter: Ref<SourceImageQueryFilter>
    }
    pane: {
        detailMode: Readonly<Ref<SourceKey | null>>
        openDetailPane(key: SourceKey): void
        closePane(): void
    }
}

interface SourceKey { source: string, sourceId: number }

export const [installSourceImageContext, useSourceImageContext] = installation(function (): SourceImageContext {
    const list = useSourceImageListContext()
    const pane = usePaneContext()

    return {list, pane}
})

function usePaneContext() {
    const detailMode = ref<SourceKey | null>(null)

    const openDetailPane = (key: SourceKey) => {
        detailMode.value = key
    }
    const closePane = () => {
        detailMode.value = null
    }
    return {detailMode: readonly(detailMode), openDetailPane, closePane}
}

function useSourceImageListContext() {
    const httpClient = useHttpClient()
    const { handleError } = useToast()
    const scrollView = useScrollView()

    const queryFilter = ref<SourceImageQueryFilter>({
        order: "-ordinal"
    })

    const endpoint = useQueryEndpoint({
        filter: queryFilter,
        request: (offset, limit, filter) => httpClient.sourceImage.list({offset, limit, ...filter}),
        handleError
    })
    const dataView = usePaginationDataView(endpoint)

    return {endpoint, dataView, scrollView, queryFilter}
}
