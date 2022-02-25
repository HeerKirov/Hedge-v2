import { ref, Ref, watch } from "vue"
import { ScrollView, useScrollView } from "@/components/logicals/VirtualScrollView"
import {
    IllustDatasetController, SelectedState, SidePaneState,
    useIllustDatasetController, useSelectedState, useSidePaneState
} from "@/layouts/data/DatasetView"
import { QuerySchemaContext, useQuerySchemaContext } from "@/layouts/topbars/Query"
import { PaginationDataView, QueryEndpointResult, usePaginationDataView, useQueryEndpoint } from "@/functions/endpoints/query-endpoint"
import { Illust, IllustQueryFilter } from "@/functions/adapter-http/impl/illust"
import { useHttpClient } from "@/services/app"
import { useRouterParamEvent } from "@/services/global/router"
import { useToast } from "@/services/module/toast"
import { installation } from "@/functions/utils/basic"
import { LocalDate } from "@/utils/datetime"

export interface IllustContext {
    dataView: PaginationDataView<Illust>
    endpoint: QueryEndpointResult<Illust>
    scrollView: Readonly<ScrollView>
    querySchema: QuerySchemaContext
    viewController: IllustDatasetController & {
        partition: Ref<LocalDate> | null
        closePartition?: () => void
    }
    selector: SelectedState
    pane: SidePaneState
}

export const [installIllustContext, useIllustContext] = installation(function(partition: Ref<LocalDate> | null, closePartition: (() => void) | undefined): IllustContext {
    const querySchema = useQuerySchemaContext("ILLUST")

    const viewController = {
        ...useIllustDatasetController(),
        partition,
        closePartition
    }

    const list = useListContext(viewController.collectionMode, partition, querySchema)

    const selector = useSelectedState(list.endpoint)

    const pane = useSidePaneState("illust", selector)

    return {...list, querySchema, viewController, selector, pane}
})

function useListContext(collectionMode: Ref<boolean>, partition: Ref<LocalDate> | null, querySchema: QuerySchemaContext) {
    const httpClient = useHttpClient()
    const { handleError } = useToast()
    const scrollView = useScrollView()

    const queryFilter = ref<IllustQueryFilter>({
        order: partition !== null ? "orderTime" : "-orderTime", //在partition模式下，排列方向为正向
        type: collectionMode.value ? "COLLECTION" : "IMAGE",
        partition: partition?.value
    })
    watch(querySchema.query, v => queryFilter.value.query = v)
    watch(collectionMode, v => queryFilter.value.type = v ? "COLLECTION" : "IMAGE")
    if(partition !== null) watch(partition, p => queryFilter.value.partition = p)

    useRouterParamEvent("MainIllusts", params => {
        //监听router event。只监听Illust的，Partition没有。
        //对于meta tag，将其简单地转换为DSL的一部分。
        //FUTURE 当然这其实是有问题的，对于topic/tag，还应该使用地址去限制它们。
        querySchema.searchBoxText.value = [
            params.tagName ? `$\`${params.tagName}\`` : undefined,
            params.topicName ? `#\`${params.topicName}\`` : undefined,
            params.authorName ? `@\`${params.authorName}\`` : undefined,
            params.source ? `^FROM:${params.source.site} ^ID:${params.source.id}` : undefined
        ].filter(i => i !== undefined).join(" ")
    })

    const endpoint = useQueryEndpoint({
        filter: queryFilter,
        request: (offset, limit, filter) => httpClient.illust.list({offset, limit, ...filter}),
        handleError
    })
    const dataView = usePaginationDataView(endpoint)

    return {endpoint, dataView, scrollView, query: querySchema.query}
}

