import { inject, InjectionKey, provide, Ref, ref, watch } from "vue"
import { Annotation, AnnotationCreateForm, AnnotationQueryFilter } from "@/functions/adapter-http/impl/annotations"
import { useHttpClient } from "@/functions/app"
import { useNotification } from "@/functions/module"
import { useScrollView, ScrollView } from "@/components/functions/VirtualScrollView"
import { ListEndpointResult, useListEndpoint } from "@/functions/utils/endpoints/list-endpoint"

export interface AnnotationContext {
    listEndpoint: ListEndpointResult<Annotation>
    scrollView: Readonly<ScrollView>
    queryFilter: Ref<AnnotationQueryFilter>
    createMode: Ref<AnnotationCreateForm | null>
    detailMode: Ref<number | null>
    openCreatePane(template?: AnnotationCreateForm)
    openDetailPane(id: number)
    closePane()
}

const annotationContextInjection: InjectionKey<AnnotationContext> = Symbol()

export function useAnnotationContext(): AnnotationContext {
    return inject(annotationContextInjection)!
}

export function installAnnotationContext(): AnnotationContext {
    const { listEndpoint, scrollView, queryFilter } = useAnnotationList()

    const { createMode, detailMode, openCreatePane, openDetailPane, closePane } = usePane()

    const context = {listEndpoint, scrollView, queryFilter, createMode, detailMode, openCreatePane, openDetailPane, closePane}

    provide(annotationContextInjection, context)

    return context
}

function useAnnotationList() {
    const httpClient = useHttpClient()
    const { handleError } = useNotification()

    const queryFilter = ref<AnnotationQueryFilter>({})
    watch(queryFilter, () => listEndpoint.refresh())

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
