import { ref, Ref, watch } from "vue"
import { ScrollView, useScrollView } from "@/components/logicals/VirtualScrollView"
import { QuerySchemaContext, useQuerySchemaContext } from "@/layouts/topbars/Query"
import { PaginationDataView, QueryEndpointResult, usePaginationDataView, useQueryEndpoint } from "@/functions/endpoints/query-endpoint"
import { Album, AlbumQueryFilter } from "@/functions/adapter-http/impl/album"
import { useHttpClient, useLocalStorageWithDefault } from "@/services/app"
import { useRouterParamEvent } from "@/services/global/router"
import { useToast } from "@/services/module/toast"
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
    const list = useListContext(querySchema)

    return {
        ...list,
        querySchema,
        viewController
    }
})

function useListContext(querySchema: QuerySchemaContext) {
    const httpClient = useHttpClient()
    const { handleError } = useToast()
    const scrollView = useScrollView()

    const queryFilter = ref<AlbumQueryFilter>({
        order: "-updateTime"
    })
    watch(querySchema.query, v => queryFilter.value.query = v)

    useRouterParamEvent("MainAlbums", params => {
        //监听router event。
        //对于meta tag，将其简单地转换为DSL的一部分。
        //FUTURE 当然这其实是有问题的，对于topic/tag，还应该使用地址去限制它们。
        querySchema.searchBoxText.value = (params.tagName ? `$\`${params.tagName}\`` : "")
            + " " + params.topicName ? `#\`${params.topicName}\`` : ""
            + " " + params.authorName ? `@\`${params.authorName}\`` : ""
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
