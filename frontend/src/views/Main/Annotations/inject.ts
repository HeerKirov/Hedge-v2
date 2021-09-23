import { Ref, ref } from "vue"
import { Annotation, AnnotationQueryFilter } from "@/functions/adapter-http/impl/annotations"
import { useHttpClient } from "@/functions/app"
import { useToast } from "@/functions/module/toast"
import { useScrollView, ScrollView } from "@/components/features/VirtualScrollView"
import { PaginationDataView, QueryEndpointResult, usePaginationDataView, useQueryEndpoint } from "@/functions/utils/endpoints/query-endpoint"
import { installation } from "@/functions/utils/basic"

export interface AnnotationContext {
    endpoint: QueryEndpointResult<Annotation>
    dataView: PaginationDataView<Annotation>
    scrollView: Readonly<ScrollView>
    queryFilter: Ref<AnnotationQueryFilter>
    createMode: Ref<Partial<Annotation> | null>
    detailMode: Ref<number | null>
    openCreatePane(template?: Partial<Annotation>): void
    openDetailPane(id: number): void
    closePane(): void
}

export const [installAnnotationContext, useAnnotationContext] = installation(function(): AnnotationContext {
    const { endpoint, dataView, scrollView, queryFilter } = useAnnotationList()

    const { createMode, detailMode, openCreatePane, openDetailPane, closePane } = usePane()

    return {endpoint, dataView, scrollView, queryFilter, createMode, detailMode, openCreatePane, openDetailPane, closePane}
})

function useAnnotationList() {
    const httpClient = useHttpClient()
    const { handleError } = useToast()

    const queryFilter = ref<AnnotationQueryFilter>({})

    const endpoint = useQueryEndpoint({
        filter: queryFilter,
        async request(offset: number, limit: number) {
            const res = await httpClient.annotation.list({offset, limit, ...queryFilter.value})
            return res.ok ? {ok: true, ...res.data} : {ok: false, message: res.exception?.message ?? "unknown error"}
        },
        handleError
    })
    const dataView = usePaginationDataView(endpoint)

    const scrollView = useScrollView()

    return {endpoint, dataView, scrollView, queryFilter}
}

function usePane() {
    const createMode = ref<Partial<Annotation> | null>(null)
    const detailMode = ref<number | null>(null)

    const openCreatePane = (template?: Partial<Annotation>) => {
        createMode.value = template ? {...template} : {}
        detailMode.value = null
    }
    const openDetailPane = (id: number) => {
        createMode.value = null
        detailMode.value = id
    }
    const closePane = () => {
        createMode.value = null
        detailMode.value = null
    }

    return {createMode, detailMode, openCreatePane, openDetailPane, closePane}
}
