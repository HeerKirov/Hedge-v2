import { computed, ref, watch } from "vue"
import { FitType } from "@/layouts/data/Dataset/common"
import { QueryEndpointResult } from "@/functions/utils/endpoints/query-endpoint"
import { useListeningEvent } from "@/functions/utils/emitter"
import { useLocalStorageWithDefault } from "@/functions/app"
import { splitRef } from "@/functions/utils/basic"

export type SelectedState = ReturnType<typeof useSelectedState>

export function useSelectedState<T extends {id: number}>(endpoint?: QueryEndpointResult<T>) {
    const selected = ref<number[]>([])
    const lastSelected = ref<number | null>(null)

    if(endpoint !== undefined) {
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
    }

    return {selected, lastSelected}
}

export function useImportImageDatasetController() {
    const storage = useLocalStorageWithDefault<{
        fitType: FitType, columnNum: number, viewMode: "grid" | "row"
    }>("import-image-dataset/view-controller", {
        fitType: "cover", columnNum: 8, viewMode: "row"
    })

    return {
        fitType: splitRef(storage, "fitType"),
        columnNum: splitRef(storage, "columnNum"),
        viewMode: splitRef(storage, "viewMode")
    }
}

export function useIllustDatasetController() {
    const storage = useLocalStorageWithDefault<{
        fitType: FitType, columnNum: number, collectionMode: boolean, viewMode: "row" | "grid"
    }>("illust-dataset/view-controller", {
        fitType: "cover", columnNum: 8, collectionMode: false, viewMode: "grid"
    })

    return {
        fitType: splitRef(storage, "fitType"),
        columnNum: splitRef(storage, "columnNum"),
        collectionMode: splitRef(storage, "collectionMode"),
        viewMode: splitRef(storage, "viewMode")
    }
}
