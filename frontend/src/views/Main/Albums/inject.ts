import { ref, Ref, watch } from "vue"
import { ScrollView, useScrollView } from "@/components/features/VirtualScrollView"
import { QuerySchemaContext, useQuerySchemaContext } from "@/layouts/topbars/Query"
import { PaginationDataView, QueryEndpointResult, usePaginationDataView, useQueryEndpoint } from "@/functions/utils/endpoints/query-endpoint"
import { Album, AlbumQueryFilter } from "@/functions/adapter-http/impl/album"
import { useHttpClient, useLocalStorageWithDefault } from "@/functions/app"
import { useToast } from "@/functions/module/toast"
import { installation, splitRef } from "@/functions/utils/basic"

export interface AlbumContext {
    dataView: PaginationDataView<Album>
    endpoint: QueryEndpointResult<Album>
    scrollView: Readonly<ScrollView>
    querySchema: QuerySchemaContext
    viewController: {
        columnNum: Ref<number>
    }
}

export const [installAlbumContext, useAlbumContext] = installation(function (): AlbumContext {
    const querySchema = useQuerySchemaContext("ALBUM")
    const viewController = useViewController()
    const list = useListContext(querySchema.query)

    return {
        ...list,
        querySchema,
        viewController
    }
})

function useListContext(query: Ref<string | undefined>) {
    const httpClient = useHttpClient()
    const { handleError } = useToast()
    const scrollView = useScrollView()

    const queryFilter = ref<AlbumQueryFilter>({
        order: "-updateTime"
    })
    watch(query, v => queryFilter.value.query = v)

    const endpoint = useQueryEndpoint({
        filter: queryFilter,
        request: (offset, limit, filter) => httpClient.album.list({offset, limit, ...filter}),
        handleError
    })
    const dataView = usePaginationDataView(endpoint)

    return {endpoint, dataView, scrollView}
}

function useViewController() {
    const storage = useLocalStorageWithDefault<{
        columnNum: number
    }>("album-grid/view-controller", {
        columnNum: 5
    })

    return { columnNum: splitRef(storage, "columnNum") }
}
