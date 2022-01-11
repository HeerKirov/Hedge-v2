import { computed, ref, Ref, watch } from "vue"
import { ScrollView, useScrollView } from "@/components/features/VirtualScrollView"
import { FitType, SelectedState, useImportImageDatasetController, useSelectedState } from "@/layouts/data/Dataset"
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
    listController: {
        viewMode: Ref<"row" | "grid">
        fitType: Ref<FitType>
        columnNum: Ref<number>
    }
    selector: SelectedState
    operation: {
        canSave: Ref<boolean>
        save(): void
    }
    pane: {
        paneMode: Readonly<Ref<"detail" | "batchUpdate" | null>>
        paneDetail: Readonly<Ref<number[] | null>>
        paneLastDetail: Readonly<Ref<number | null>>
        paneEnabled: Readonly<Ref<boolean>>
        enableDetailPane(id?: number): void
        disableDetailPane(): void
        openBatchUpdatePane(): void
        closePane(): void
    }
}

export const [installImportContext, useImportContext] = installation(function(): ImportContext {
    const list = useImportListContext()
    const listController = useImportImageDatasetController()
    const selector = useSelectedState(list.endpoint)
    const pane = usePaneContext(selector)
    const operation = useImportOperationContext(list.dataView, list.endpoint, pane)

    return {list, listController, selector, pane, operation}
})

//TODO 提取detail selector部分抽离到dataset layout
function usePaneContext(selector: SelectedState) {
    const paneMode = ref<"detail" | "batchUpdate" | null>(null)
    const paneDetail = ref<number[] | null>(null)
    const paneLastDetail = ref<number | null>(null)
    const paneEnabled = computed(() => paneMode.value === "detail" && paneDetail.value !== null || paneMode.value === "batchUpdate")

    watch(() => [selector.selected.value, selector.lastSelected.value] as const, ([selected, lastSelected]) => {
        if(paneMode.value !== null) {
            if(selected.length > 0) {
                paneDetail.value = [...selected]
            }else{
                paneDetail.value = null
            }
            paneLastDetail.value = lastSelected ?? (selected.length > 0 ? selected[selected.length - 1] : null)
        }
    })

    const enableDetailPane = (id?: number) => {
        paneMode.value = "detail"
        if(id !== undefined) {
            paneDetail.value = [id]
        }else if(selector.selected.value.length > 0) {
            paneDetail.value = [...selector.selected.value]
        }else{
            paneDetail.value = null
        }
        paneLastDetail.value = id ?? selector.lastSelected.value ?? (selector.selected.value.length > 0 ? selector.selected.value[selector.selected.value.length - 1] : null)
    }

    const disableDetailPane = () => {
        paneMode.value = null
        paneDetail.value = null
        paneLastDetail.value = null
    }

    const openBatchUpdatePane = () => {
        paneMode.value = "batchUpdate"
    }

    const closePane = () => {
        paneMode.value = null
        paneDetail.value = null
        paneLastDetail.value = null
    }
    return {paneMode, paneDetail, paneLastDetail, paneEnabled, enableDetailPane, disableDetailPane, openBatchUpdatePane, closePane}
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

    useListContentUpdater(dataView)

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

function useListContentUpdater(dataView: PaginationDataView<ImportImage>) {
    const toast = useToast()
    const httpClient = useHttpClient()
    const needUpdateItemSet = new Set<number>()
    let timer: number | null = null

    watch(dataView.data, data => {
        //当dataView数据视图的内容发生变化时，从中过滤出缩略图为null的项。这些项需要通过实时轮询获得更新
        const filtered = data.result.filter(item => item.thumbnailFile === null)
        if(filtered.length > 0) {
            filtered.forEach(item => needUpdateItemSet.add(item.id))
            if(needUpdateItemSet.size > 0 && timer === null) {
                timer = setInterval(async () => {
                    for (const itemId of needUpdateItemSet.keys()) {
                         const res = await httpClient.import.get(itemId)
                        if(res.ok) {
                            if(res.data.thumbnailFile !== null) {
                                const index = dataView.proxy.syncOperations.find(i => i.id === itemId)
                                if(index !== undefined) {
                                    dataView.proxy.syncOperations.modify(index, {
                                        id: res.data.id,
                                        file: res.data.file,
                                        thumbnailFile: res.data.thumbnailFile,
                                        fileName: res.data.fileName,
                                        source: res.data.source,
                                        sourceId: res.data.sourceId,
                                        sourcePart: res.data.sourcePart,
                                        tagme: res.data.tagme,
                                        partitionTime: res.data.partitionTime,
                                        orderTime: res.data.orderTime
                                    })
                                }
                                needUpdateItemSet.delete(itemId)
                            }
                        }else if (res.exception.code === "NOT_FOUND") {
                            //404，那么将这个项移除
                            const index = dataView.proxy.syncOperations.find(i => i.id === itemId)
                            if(index !== undefined) {
                                dataView.proxy.syncOperations.remove(index)
                            }
                            needUpdateItemSet.delete(itemId)
                        }else{
                            toast.handleException(res.exception)
                        }
                    }

                    if(needUpdateItemSet.size <= 0 && timer !== null) {
                        clearInterval(timer)
                        timer = null
                    }
                }, 500)
            }
        }
    })
}
