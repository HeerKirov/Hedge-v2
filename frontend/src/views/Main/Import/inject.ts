import { computed, ref, Ref, watch } from "vue"
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
    const viewController = useViewController()
    const selector = useSelector(list.endpoint)
    const pane = usePaneContext(selector)
    const operation = useImportOperationContext(list.dataView, list.endpoint, pane)

    return {list, viewController, selector, pane, operation}
})

function usePaneContext(selector: ReturnType<typeof useSelector>) {
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
                                        fileImportTime: res.data.fileImportTime
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
