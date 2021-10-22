import { ref, Ref, watch } from "vue"
import { useScrollView, ScrollView } from "@/components/features/VirtualScrollView"
import { FitType } from "@/layouts/data/IllustGrid"
import { PaginationDataView, QueryEndpointResult, usePaginationDataView, useQueryEndpoint } from "@/functions/utils/endpoints/query-endpoint"
import { Illust, IllustQueryFilter } from "@/functions/adapter-http/impl/illust"
import { useHttpClient, useLocalStorageWithDefault } from "@/functions/app"
import { useToast } from "@/functions/module/toast"
import { useListeningEvent } from "@/functions/utils/emitter"
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

    const selector = useSelector(list.endpoint)

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
        request: (offset, limit, filter) => httpClient.illust.list({offset, limit, ...filter}),
        handleError
    })
    const dataView = usePaginationDataView(endpoint)

    return {endpoint, dataView, scrollView}
}

function useViewController() {
    const storage = useLocalStorageWithDefault<{
        fitType: FitType, columnNum: number, collectionMode: boolean
    }>("illust-grid/view-controller", {
        fitType: "cover", columnNum: 8, collectionMode: false
    })

    return {
        fitType: splitRef(storage, "fitType"),
        columnNum: splitRef(storage, "columnNum"),
        collectionMode: splitRef(storage, "collectionMode")
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
