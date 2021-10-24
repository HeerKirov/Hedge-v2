import { ref, Ref } from "vue"
import { ScrollView, useScrollView } from "@/components/features/VirtualScrollView"
import { PaginationDataView, QueryEndpointResult, usePaginationDataView, useQueryEndpoint } from "@/functions/utils/endpoints/query-endpoint"
import { Album, AlbumQueryFilter } from "@/functions/adapter-http/impl/album"
import { useHttpClient, useLocalStorageWithDefault } from "@/functions/app"
import { useToast } from "@/functions/module/toast"
import { installation, splitRef } from "@/functions/utils/basic"

export interface AlbumContext {
    dataView: PaginationDataView<Album>
    endpoint: QueryEndpointResult<Album>
    scrollView: Readonly<ScrollView>
    viewController: {
        columnNum: Ref<number>
    }
}

export const [installAlbumContext, useAlbumContext] = installation(function (): AlbumContext {
    const viewController = useViewController()
    const list = useListContext()

    return {
        ...list,
        viewController
    }
})

function useListContext() {
    const httpClient = useHttpClient()
    const { handleError } = useToast()
    const scrollView = useScrollView()

    const queryFilter = ref<AlbumQueryFilter>({
        order: "-updateTime"
    })

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
