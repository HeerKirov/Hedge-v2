import { ref, Ref, watch } from "vue"
import { useScrollView, ScrollView } from "@/components/features/VirtualScrollView"
import { FitType } from "@/layouts/data/IllustGrid"
import { PaginationDataView, QueryEndpointResult, usePaginationDataView, useQueryEndpoint } from "@/functions/utils/endpoints/query-endpoint"
import { Illust, IllustQueryFilter } from "@/functions/adapter-http/impl/illust"
import { useHttpClient, useLocalStorageWithDefault } from "@/functions/app"
import { useToast } from "@/functions/module/toast"
import { installation, splitRef } from "@/functions/utils/basic"

export interface IllustContext {
    dataView: PaginationDataView<Illust>
    endpoint: QueryEndpointResult<Illust>
    scrollView: Readonly<ScrollView>
    viewController: {
        fitType: Ref<FitType>
        columnNum: Ref<number>
        collectionMode: Ref<boolean>
    }
    selector: {
        selected: Ref<number[]>
        lastSelected: Ref<number | null>
    }
}

export const [installIllustContext, useIllustContext] = installation(function(): IllustContext {
    const viewController = useViewController()

    const list = useListContext(viewController.collectionMode)

    const selector = useSelector()

    return {...list, viewController, selector}
})

function useListContext(collectionMode: Ref<boolean>) {
    const httpClient = useHttpClient()
    const { handleError } = useToast()
    const scrollView = useScrollView()

    const queryFilter = ref<IllustQueryFilter>({
        order: "-orderTime",
        type: collectionMode.value ? "COLLECTION" : "IMAGE"
    })
    watch(collectionMode, v => queryFilter.value.type = v ? "COLLECTION" : "IMAGE")

    const endpoint = useQueryEndpoint({
        filter: queryFilter,
        async request(offset: number, limit: number, filter: IllustQueryFilter) {
            const res = await httpClient.illust.list({offset, limit, ...filter})
            return res.ok ? {ok: true, ...res.data} : {ok: false, message: res.exception?.message ?? "unknown error"}
        },
        handleError
    })
    const dataView = usePaginationDataView(endpoint)

    return {endpoint, dataView, scrollView}
}

function useViewController() {
    const storage = useLocalStorageWithDefault<{
        fitType: FitType, columnNum: number, collectionMode: boolean
    }>("illust-list-view-controller", {
        fitType: "cover", columnNum: 8, collectionMode: false
    })

    return {
        fitType: splitRef(storage, "fitType"),
        columnNum: splitRef(storage, "columnNum"),
        collectionMode: splitRef(storage, "collectionMode")
    }
}

function useSelector() {
    const selected = ref<number[]>([])
    const lastSelected = ref<number | null>(null)

    return {selected, lastSelected}
}
