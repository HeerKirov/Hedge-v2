import { computed, ref, Ref, watch } from "vue"
import { ScrollView, useScrollView } from "@/components/logicals/VirtualScrollView"
import { PaginationDataView, QueryEndpointResult, usePaginationDataView, useQueryEndpoint } from "@/functions/endpoints/query-endpoint"
import {
    IllustDatasetController, SelectedState, SidePaneState,
    useIllustDatasetController, useSelectedState, useSidePaneState
} from "@/layouts/data/DatasetView"
import { Folder, FolderImage, FolderImageQueryFilter } from "@/functions/adapter-http/impl/folder"
import { installation } from "@/functions/utils/basic"
import { useHttpClient, useLocalStorageWithDefault } from "@/services/app"
import { useObjectEndpoint } from "@/functions/endpoints/object-endpoint"
import { useToast } from "@/services/module/toast"
import { useFolderContext } from "../inject"

export interface FolderDetailContext {
    dataView: PaginationDataView<FolderImage>
    endpoint: QueryEndpointResult<FolderImage>
    scrollView: Readonly<ScrollView>
    viewController: Exclude<IllustDatasetController, "collectionMode"> & { editable: Ref<boolean> }
    selector: SelectedState
    pane: SidePaneState
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

    const pane = useSidePaneState("illust", selector)

    const detail = useDetail()

    return {...list, viewController, selector, pane, detail}
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
