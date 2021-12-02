import { computed, ref, Ref, watch } from "vue"
import { ScrollView, useScrollView } from "@/components/features/VirtualScrollView"
import { PaginationDataView, QueryEndpointResult, usePaginationDataView, useQueryEndpoint } from "@/functions/utils/endpoints/query-endpoint"
import { FitType } from "@/layouts/data/IllustGrid"
import { Folder, FolderImage, FolderImageQueryFilter } from "@/functions/adapter-http/impl/folder"
import { installation, splitRef } from "@/functions/utils/basic"
import { useHttpClient, useLocalStorageWithDefault } from "@/functions/app"
import { useObjectEndpoint } from "@/functions/utils/endpoints/object-endpoint"
import { useListeningEvent } from "@/functions/utils/emitter"
import { useToast } from "@/functions/module/toast"
import { useFolderContext } from "../inject"

export interface FolderDetailContext {
    dataView: PaginationDataView<FolderImage>
    endpoint: QueryEndpointResult<FolderImage>
    scrollView: Readonly<ScrollView>
    viewController: {
        fitType: Ref<FitType>
        columnNum: Ref<number>
        editable: Ref<boolean>
    }
    selector: {
        selected: Ref<number[]>
        lastSelected: Ref<number | null>
    }
    detail: {
        id: Ref<number>
        data: Ref<Folder | null>
    }
}

export const [installDetailContext, useDetailContext] = installation(function(): FolderDetailContext {
    const viewController = useViewController()

    const list = useListContext()

    const selector = useSelector(list.endpoint)

    const detail = useDetail()

    return {...list, viewController, selector, detail}
})

function useDetail() {
    const { view: { detailView } } = useFolderContext()

    const id = computed(() => detailView.value!)
    const { data } = useObjectEndpoint({
        path: id,
        get: httpClient => httpClient.folder.get
    })

    return {id, data}
}

function useListContext() {
    const httpClient = useHttpClient()
    const toast = useToast()
    const scrollView = useScrollView()
    const { view: { detailView } } = useFolderContext()

    const queryFilter = ref<FolderImageQueryFilter>({
        order: "ordinal"
    })

    const endpoint = useQueryEndpoint({
        filter: queryFilter,
        request: (offset, limit, filter) => httpClient.folder.images.get(detailView.value!, {offset, limit, ...filter}),
        handleError: toast.handleError
    })
    const dataView = usePaginationDataView(endpoint)

    watch(detailView, v => {
        if(v !== null) {
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

    const editable = useLocalStorageWithDefault<boolean>("folder-detail/editable", false)

    return {
        fitType: splitRef(storage, "fitType"),
        columnNum: splitRef(storage, "columnNum"),
        editable
    }
}

function useSelector(endpoint: QueryEndpointResult<FolderImage>) {
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
