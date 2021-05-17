import { Ref, ref, watch } from "vue"
import { Annotation, AnnotationQueryFilter } from "@/functions/adapter-http/impl/annotations"
import { useHttpClient } from "@/functions/app"
import { useNotification } from "@/functions/module"
import { useScrollView, ScrollView } from "@/components/features/VirtualScrollView"
import { ListEndpointResult, useListEndpoint } from "@/functions/utils/endpoints/list-endpoint"
import { installation } from "@/functions/utils/basic"

export interface AnnotationContext {
    listEndpoint: ListEndpointResult<Annotation>
    scrollView: Readonly<ScrollView>
    queryFilter: Ref<AnnotationQueryFilter>
    createMode: Ref<Partial<Annotation> | null>
    detailMode: Ref<number | null>
    openCreatePane(template?: Partial<Annotation>): void
    openDetailPane(id: number): void
    closePane(): void
}

export const [installAnnotationContext, useAnnotationContext] = installation(function(): AnnotationContext {
    const { listEndpoint, scrollView, queryFilter } = useAnnotationList()

    const { createMode, detailMode, openCreatePane, openDetailPane, closePane } = usePane()

    return {listEndpoint, scrollView, queryFilter, createMode, detailMode, openCreatePane, openDetailPane, closePane}
})

function useAnnotationList() {
    const httpClient = useHttpClient()
    const { handleError } = useNotification()

    const queryFilter = ref<AnnotationQueryFilter>({})
    watch(queryFilter, () => listEndpoint.refresh(), {deep: true})

    const listEndpoint = useListEndpoint({
        async request(offset: number, limit: number) {
            const res = await httpClient.annotation.list({offset, limit, ...queryFilter.value})
            return res.ok ? {ok: true, ...res.data} : {ok: false, message: res.exception?.message ?? "unknown error"}
        },
        handleError
    })

    const scrollView = useScrollView()

    return {listEndpoint, scrollView, queryFilter}
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
