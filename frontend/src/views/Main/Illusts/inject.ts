import { ref, Ref, watch } from "vue"
import { ScrollView, useScrollView } from "@/components/features/VirtualScrollView"
import { FitType } from "@/layouts/data/IllustGrid"
import { QuerySchemaContext, useQuerySchemaContext } from "@/layouts/topbars/Query"
import { PaginationDataView, QueryEndpointResult, usePaginationDataView, useQueryEndpoint } from "@/functions/utils/endpoints/query-endpoint"
import { Illust, IllustQueryFilter } from "@/functions/adapter-http/impl/illust"
import { useHttpClient, useLocalStorageWithDefault } from "@/functions/app"
import { useRouterParamEvent } from "@/functions/feature/router"
import { useToast } from "@/functions/module/toast"
import { useListeningEvent } from "@/functions/utils/emitter"
import { installation, splitRef } from "@/functions/utils/basic"
import { LocalDate } from "@/utils/datetime"

export interface IllustContext {
    dataView: PaginationDataView<Illust>
    endpoint: QueryEndpointResult<Illust>
    scrollView: Readonly<ScrollView>
    querySchema: QuerySchemaContext
    viewController: {
        fitType: Ref<FitType>
        columnNum: Ref<number>
        collectionMode: Ref<boolean>
        partition: Ref<LocalDate> | null
        closePartition?: () => void
    }
    selector: {
        selected: Ref<number[]>
        lastSelected: Ref<number | null>
    }
}

export const [installIllustContext, useIllustContext] = installation(function(partition: Ref<LocalDate> | null, closePartition: (() => void) | undefined): IllustContext {
    const querySchema = useQuerySchemaContext("ILLUST")

    const viewController = useViewController(partition, closePartition)

    const list = useListContext(viewController.collectionMode, partition, querySchema)

    const selector = useSelector(list.endpoint)

    return {...list, querySchema, viewController, selector}
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
        querySchema.searchBoxText.value = (params.tagName ? `$\`${params.tagName}\`` : "")
            + " " + params.topicName ? `#\`${params.topicName}\`` : ""
            + " " + params.authorName ? `@\`${params.authorName}\`` : ""
    })

    const endpoint = useQueryEndpoint({
        filter: queryFilter,
        request: (offset, limit, filter) => httpClient.illust.list({offset, limit, ...filter}),
        handleError
    })
    const dataView = usePaginationDataView(endpoint)

    return {endpoint, dataView, scrollView, query: querySchema.query}
}

function useViewController(partition: Ref<LocalDate> | null, closePartition: (() => void) | undefined) {
    const storage = useLocalStorageWithDefault<{
        fitType: FitType, columnNum: number, collectionMode: boolean
    }>("illust-grid/view-controller", {
        fitType: "cover", columnNum: 8, collectionMode: false
    })

    return {
        fitType: splitRef(storage, "fitType"),
        columnNum: splitRef(storage, "columnNum"),
        collectionMode: splitRef(storage, "collectionMode"),
        partition, closePartition
    }
}

function useSelector(endpoint: QueryEndpointResult<Illust>) {
    const selected = ref<number[]>([])
    const lastSelected = ref<number | null>(null)

    watch(endpoint.instance, () => {
        //在更新实例时，清空已选择项
        selected.value = []
        lastSelected.value = null
    })
    useListeningEvent(endpoint.modifiedEvent, e => {
        if(e.type === "remove") {
            //当监听到数据被移除时，检查是否属于当前已选择项，并将其从已选择中移除
            const id = e.oldValue.id
            const index = selected.value.findIndex(i => i === id)
            if(index >= 0) selected.value.splice(index, 1)
            if(lastSelected.value === id) lastSelected.value = null
        }
    })

    return {selected, lastSelected}
}
