import { computed, ref, Ref, watch } from "vue"
import { ScrollView, useScrollView } from "@/components/features/VirtualScrollView"
import { PaginationDataView, QueryEndpointResult, usePaginationDataView, useQueryEndpoint } from "@/functions/utils/endpoints/query-endpoint"
import { FitType, useIllustDatasetController, useSelectedState } from "@/layouts/data/Dataset"
import { Folder, FolderImage, FolderImageQueryFilter } from "@/functions/adapter-http/impl/folder"
import { installation } from "@/functions/utils/basic"
import { useHttpClient, useLocalStorageWithDefault } from "@/functions/app"
import { useObjectEndpoint } from "@/functions/utils/endpoints/object-endpoint"
import { useToast } from "@/functions/module/toast"
import { useFolderContext } from "../inject"

export interface FolderDetailContext {
    dataView: PaginationDataView<FolderImage>
    endpoint: QueryEndpointResult<FolderImage>
    scrollView: Readonly<ScrollView>
    viewController: {
        viewMode: Ref<"row" | "grid">
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
    const viewController = {
        ...useIllustDatasetController(),
        editable: useLocalStorageWithDefault<boolean>("folder-detail/editable", false)
    }

    const list = useListContext()

    const selector = useSelectedState(list.endpoint)

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
