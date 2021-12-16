import { computed, readonly, ref, Ref, watch } from "vue"
import { ScrollView, useScrollView } from "@/components/features/VirtualScrollView"
import { FitType } from "@/layouts/data/IllustGrid"
import { ImportImage } from "@/functions/adapter-http/impl/import"
import { PaginationDataView, QueryEndpointResult, usePaginationDataView, useQueryEndpoint } from "@/functions/utils/endpoints/query-endpoint"
import { useHttpClient, useLocalStorageWithDefault } from "@/functions/app"
import { useToast } from "@/functions/module/toast"
import { useImportService } from "@/functions/api/import"
import { installation, splitRef } from "@/functions/utils/basic"
import { useListeningEvent } from "@/functions/utils/emitter"

export interface ImportContext {
    list: {
        dataView: PaginationDataView<ImportImage>
        endpoint: QueryEndpointResult<ImportImage>
        scrollView: Readonly<ScrollView>
    }
    viewController: {
        fitType: Ref<FitType>
        columnNum: Ref<number>
    }
    selector: {
        selected: Ref<number[]>
        lastSelected: Ref<number | null>
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
    const viewController = useViewController()
    const selector = useSelector(list.endpoint)
    const pane = usePaneContext()
    const operation = useImportOperationContext(list.dataView, list.endpoint, pane)

    return {list, viewController, selector, pane, operation}
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

function useViewController() {
    const storage = useLocalStorageWithDefault<{
        fitType: FitType, columnNum: number, collectionMode: boolean
    }>("illust-grid/view-controller", {
        fitType: "cover", columnNum: 8, collectionMode: false
    })

    return {
        fitType: splitRef(storage, "fitType"),
        columnNum: splitRef(storage, "columnNum")
    }
}

function useSelector(endpoint: QueryEndpointResult<ImportImage>) {
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

function useImportOperationContext(dataView: PaginationDataView<ImportImage>, endpoint: QueryEndpointResult<ImportImage>, pane: ReturnType<typeof usePaneContext>) {
    const httpClient = useHttpClient()
    const { handleException, toast } = useToast()

    const canSave = computed(() => dataView.data.value.metrics.total != undefined && dataView.data.value.metrics.total > 0)

    const save = async () => {
        if(canSave.value) {
            const res = await httpClient.import.save()
            if(res.ok) {
                const { total } = res.data
                toast("导入项目", "success", `${total}个项目已导入图库。`)
                endpoint.refresh()
                pane.closePane()
            }else if(res.exception.code === "FILE_NOT_READY") {
                toast("未准备完毕", "warning", "仍有导入项目未准备完毕。请等待。")
            }else if(res.exception) {
                handleException(res.exception)
            }
        }
    }

    return {canSave, save}
}
