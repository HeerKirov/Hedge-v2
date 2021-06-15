import { computed, readonly, ref, Ref, watch } from "vue"
import { ScrollView, useScrollView } from "@/components/features/VirtualScrollView"
import { ImportImage } from "@/functions/adapter-http/impl/import"
import { ListEndpointResult, useListEndpoint } from "@/functions/utils/endpoints/list-endpoint"
import { useHttpClient } from "@/functions/app"
import { useNotification } from "@/functions/document/notification"
import { useImportService } from "@/functions/api/import"
import { installation } from "@/functions/utils/basic"

export interface ImportContext {
    list: {
        endpoint: ListEndpointResult<ImportImage>
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
    const operation = useImportOperationContext(list.endpoint)

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

function useImportOperationContext(endpoint: ListEndpointResult<ImportImage>) {
    const httpClient = useHttpClient()
    const { handleException, notify } = useNotification()

    const canSave = computed(() => endpoint.data.value.metrics.total != undefined && endpoint.data.value.metrics.total > 0)

    const save = async () => {
        if(canSave.value) {
            const res = await httpClient.import.save()
            if (res.ok) {
                const { total, succeed } = res.data
                if (succeed < total) {
                    notify("导入结果", "warning", `${succeed}个项目已导入图库，${total - succeed}个项目导入失败。`)
                } else {
                    notify("导入结果", "success", `${total}个项目已导入图库。`)
                }
                endpoint.refresh()
            } else if (res.exception) {
                handleException(res.exception)
            }
        }
    }

    return {canSave, save}
}
