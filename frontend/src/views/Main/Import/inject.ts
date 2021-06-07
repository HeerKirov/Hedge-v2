import { readonly, ref, Ref, watch } from "vue"
import { ScrollView, useScrollView } from "@/components/features/VirtualScrollView"
import { ImportImage } from "@/functions/adapter-http/impl/import"
import { ListEndpointResult, useListEndpoint } from "@/functions/utils/endpoints/list-endpoint"
import { useHttpClient } from "@/functions/app"
import { useNotification } from "@/functions/document/notification"
import { useImportService } from "@/functions/background"
import { installation } from "@/functions/utils/basic"

export interface ImportContext {
    list: {
        endpoint: ListEndpointResult<ImportImage>
        scrollView: Readonly<ScrollView>
    }
    pane: {
        detailMode: Readonly<Ref<number | null>>
        infoMode: Readonly<Ref<boolean>>
        openDetailPane(id: number): void
        openInfoPane(): void
        closePane(): void
    }
}

export const [installImportContext, useImportContext] = installation(function(): ImportContext {
    return {
        list: useImportListContext(),
        pane: usePaneContext()
    }
})

function usePaneContext() {
    const detailMode = ref<number | null>(null)
    const infoMode = ref(false)

    const openDetailPane = (id: number) => {
        detailMode.value = id
        infoMode.value = false
    }
    const openInfoPane = () => {
        detailMode.value = null
        infoMode.value = true
    }
    const closePane = () => {
        detailMode.value = null
        infoMode.value = false
    }
    return {detailMode: readonly(detailMode), infoMode: readonly(infoMode), openDetailPane, openInfoPane, closePane}
}

function useImportListContext() {
    const httpClient = useHttpClient()
    const { handleError } = useNotification()
    const { isProgressing } = useImportService()
    const scrollView = useScrollView()

    const endpoint = useListEndpoint({
        async request(offset: number, limit: number) {
            const res = await httpClient.import.list({offset, limit, order: "+id"})
            return res.ok ? {ok: true, ...res.data} : {ok: false, message: res.exception?.message ?? "unknown error"}
        },
        handleError
    })

    watch(isProgressing, (v, o) => {
        if(!v && o) {
            endpoint.refresh()
        }
    })

    return {endpoint, scrollView}
}
