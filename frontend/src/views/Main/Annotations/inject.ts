import { InjectionKey, Ref, ref, shallowRef, watch } from "vue"
import { Annotation, AnnotationCreateForm, AnnotationQueryFilter } from "@/functions/adapter-http/impl/annotations"
import { useHttpClient } from "@/functions/service"
import { useNotification } from "@/functions/message"
import { useScrollView, ScrollView } from "@/components/VirtualScrollView"
import { DataEndpointResult, useDataEndpoint } from "@/functions/utils/data-endpoint"

export const annotationContextInjection: InjectionKey<AnnotationContext> = Symbol()

export interface AnnotationContext {
    dataEndpoint: DataEndpointResult<Annotation>
    scrollView: Readonly<ScrollView>
    queryFilter: Ref<AnnotationQueryFilter>
    createMode: Ref<AnnotationCreateForm | null>
    detailMode: Ref<number | null>
    openCreatePane(template?: AnnotationCreateForm)
    openDetailPane(id: number)
    closePane()
}

export function useAnnotationContextInjection(): AnnotationContext {
    const { dataEndpoint, scrollView, queryFilter } = useAnnotationList()

    const { createMode, detailMode, openCreatePane, openDetailPane, closePane } = usePane()

    return {dataEndpoint, scrollView, queryFilter, createMode, detailMode, openCreatePane, openDetailPane, closePane}
}

function useAnnotationList() {
    const httpClient = useHttpClient()
    const { handleError } = useNotification()

    const queryFilter = ref<AnnotationQueryFilter>({})
    watch(queryFilter, () => dataEndpoint.refresh())

    const dataEndpoint = useDataEndpoint({
        async request(offset: number, limit: number) {
            const res = await httpClient.annotation.list({offset, limit, ...queryFilter.value})
            return res.ok ? {ok: true, ...res.data} : {ok: false, message: res.exception?.message ?? "unknown error"}
        },
        handleError
    })

    const scrollView = useScrollView()

    return {dataEndpoint, scrollView, queryFilter}
}

function usePane() {
    const createMode = ref<AnnotationCreateForm | null>(null)
    const detailMode = ref<number | null>(null)

    const openCreatePane = (template?: AnnotationCreateForm) => {
        createMode.value = template ?? {
            name: "",
            canBeExported: false,
            target: []
        }
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