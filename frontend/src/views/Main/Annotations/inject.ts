import { InjectionKey, Ref, ref, watch } from "vue"
import { Annotation, AnnotationQueryFilter } from "@/functions/adapter-http/impl/annotations"
import { useHttpClient } from "@/functions/service"
import { useNotification } from "@/functions/message"
import { useScrollView, ScrollView } from "@/components/VirtualScrollView"
import { DataEndpointResult, useDataEndpoint } from "@/functions/utils/data-endpoint"

export const annotationContextInjection: InjectionKey<AnnotationContext> = Symbol()

export interface AnnotationContext {
    dataEndpoint: DataEndpointResult<Annotation>
    scrollView: Readonly<ScrollView>
    queryFilter: Ref<AnnotationQueryFilter>
    detail: Ref<number | "NEW" | null>
}

export function useAnnotationContextInjection(): AnnotationContext {
    const { dataEndpoint, scrollView, queryFilter } = useAnnotationList()

    const detail = ref<number | "NEW" | null>(1)

    return {dataEndpoint, scrollView, queryFilter, detail}
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