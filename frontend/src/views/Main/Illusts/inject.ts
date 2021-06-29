import { ref, Ref, watch } from "vue"
import { useScrollView, ScrollView } from "@/components/features/VirtualScrollView"
import { FitType } from "@/layouts/data/IllustGrid"
import { ListEndpointResult, useListEndpoint } from "@/functions/utils/endpoints/list-endpoint"
import { Illust, IllustQueryFilter } from "@/functions/adapter-http/impl/illust"
import { useHttpClient, useLocalStorageWithDefault } from "@/functions/app"
import { useNotification } from "@/functions/document/notification"
import { installation, splitRef } from "@/functions/utils/basic"

export interface IllustContext {
    endpoint: ListEndpointResult<Illust>
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
    const { handleError } = useNotification()
    const scrollView = useScrollView()

    const queryFilter = ref<IllustQueryFilter>({
        order: "-orderTime",
        type: collectionMode.value ? "COLLECTION" : "IMAGE"
    })
    watch(collectionMode, v => queryFilter.value.type = v ? "COLLECTION" : "IMAGE")
    watch(queryFilter, () => endpoint.refresh(), {deep: true})

    const endpoint = useListEndpoint({
        async request(offset: number, limit: number) {
            const res = await httpClient.illust.list({offset, limit, ...queryFilter.value})
            return res.ok ? {ok: true, ...res.data} : {ok: false, message: res.exception?.message ?? "unknown error"}
        },
        handleError
    })

    return {endpoint, scrollView}
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
