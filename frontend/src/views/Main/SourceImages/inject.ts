import { readonly, ref, Ref, watch } from "vue"
import { ScrollView, useScrollView } from "@/components/logicals/VirtualScrollView"
import { QuerySchemaContext, useQuerySchemaContext } from "@/layouts/topbars/Query"
import { PaginationDataView, QueryEndpointResult, usePaginationDataView, useQueryEndpoint } from "@/functions/endpoints/query-endpoint"
import { SourceImage, SourceImageQueryFilter } from "@/functions/adapter-http/impl/source-image"
import { installation } from "@/functions/utils/basic"
import { useHttpClient } from "@/services/app"
import { useToast } from "@/services/module/toast"

export interface SourceImageContext {
    list: {
        endpoint: QueryEndpointResult<SourceImage>
        dataView: PaginationDataView<SourceImage>
        scrollView: Readonly<ScrollView>
        queryFilter: Ref<SourceImageQueryFilter>
    }
    querySchema: QuerySchemaContext
    pane: {
        detailMode: Readonly<Ref<SourceKey | null>>
        openDetailPane(key: SourceKey): void
        closePane(): void
    }
}

export interface SourceKey { source: string, sourceId: number }

export function keyEqual(key: SourceKey | null | undefined, key2: SourceKey | null | undefined): boolean {
    return key != null && key2 != null && key.source === key2.source && key.sourceId === key2.sourceId
}

export const [installSourceImageContext, useSourceImageContext] = installation(function (): SourceImageContext {
    const querySchema = useQuerySchemaContext("SOURCE_IMAGE")
    const list = useSourceImageListContext(querySchema.query)
    const pane = usePaneContext()

    return {list, pane, querySchema}
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

function useSourceImageListContext(query: Ref<string | undefined>) {
    const httpClient = useHttpClient()
    const { handleError } = useToast()
    const scrollView = useScrollView()

    const queryFilter = ref<SourceImageQueryFilter>({
        order: "-rowId"
    })
    watch(query, v => queryFilter.value.query = v)

    const endpoint = useQueryEndpoint({
        filter: queryFilter,
        request: (offset, limit, filter) => httpClient.sourceImage.list({offset, limit, ...filter}),
        handleError
    })
    const dataView = usePaginationDataView(endpoint)

    return {endpoint, dataView, scrollView, queryFilter}
}
