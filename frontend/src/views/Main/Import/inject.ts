import { computed, readonly, ref, Ref, watch } from "vue"
import { ScrollView, useScrollView } from "@/components/features/VirtualScrollView"
import { ImportImage } from "@/functions/adapter-http/impl/import"
import { PaginationDataView, QueryEndpointResult, usePaginationDataView, useQueryEndpoint } from "@/functions/utils/endpoints/query-endpoint"
import { useHttpClient } from "@/functions/app"
import { useToast } from "@/functions/module/toast"
import { useImportService } from "@/functions/api/import"
import { installation } from "@/functions/utils/basic"

export interface ImportContext {
    list: {
        dataView: PaginationDataView<ImportImage>
        endpoint: QueryEndpointResult<ImportImage>
        scrollView: Readonly<ScrollView>
    }
    operation: {
        canSave: Ref<boolean>
        save(): void
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
    const list = useImportListContext()
    const pane = usePaneContext()
    const operation = useImportOperationContext(list.dataView, list.endpoint, pane)

    return {list, pane, operation}
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
    const { handleError } = useToast()
    const { isProgressing } = useImportService()
    const scrollView = useScrollView()

    const endpoint = useQueryEndpoint({
        request: (offset, limit) => httpClient.import.list({offset, limit, order: "+id"}),
        handleError
    })
    const dataView = usePaginationDataView(endpoint)

    watch(isProgressing, (v, o) => {
        if(!v && o) {
            endpoint.refresh()
        }
    })

    return {endpoint, dataView, scrollView}
}

function useImportOperationContext(dataView: PaginationDataView<ImportImage>, endpoint: QueryEndpointResult<ImportImage>, pane: ReturnType<typeof usePaneContext>) {
    const httpClient = useHttpClient()
    const { handleException, toast } = useToast()

    const canSave = computed(() => dataView.data.value.metrics.total != undefined && dataView.data.value.metrics.total > 0)

    const save = async () => {
        if(canSave.value) {
            const res = await httpClient.import.save()
            if (res.ok) {
                const { total, succeed } = res.data
                if (succeed < total) {
                    toast("导入结果", "warning", `${succeed}个项目已导入图库，${total - succeed}个项目导入失败。`)
                } else {
                    toast("导入结果", "success", `${total}个项目已导入图库。`)
                }
                endpoint.refresh()
                pane.closePane()
            } else if (res.exception) {
                handleException(res.exception)
            }
        }
    }

    return {canSave, save}
}
