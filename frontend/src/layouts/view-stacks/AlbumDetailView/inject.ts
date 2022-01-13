import { computed, onBeforeMount, ref, Ref } from "vue"
import { Album, AlbumExceptions, AlbumImage, AlbumUpdateForm, DetailAlbum } from "@/functions/adapter-http/impl/album"
import { ScrollView, useScrollView } from "@/components/features/VirtualScrollView"
import { PaginationDataView, QueryEndpointResult, SingletonDataView, usePaginationDataView, useQueryEndpoint } from "@/functions/utils/endpoints/query-endpoint"
import {
    IllustDatasetController, SelectedState, SidePaneState,
    useIllustDatasetController, useSelectedState, useSidePaneState
} from "@/layouts/data/Dataset"
import { useToast } from "@/functions/module/toast"
import { useHttpClient, useLocalStorageWithDefault } from "@/functions/app"
import { useObjectEndpoint, ObjectEndpoint } from "@/functions/utils/endpoints/object-endpoint"
import { useFastObjectEndpoint } from "@/functions/utils/endpoints/object-fast-endpoint"
import { installation } from "@/functions/utils/basic"

export interface PreviewContext {
    /**
     * 当前所引用的album的原始对象的数据和操作。
     */
    data: {
        /**
         * album id。
         */
        id: Readonly<Ref<number | null>>
        /**
         * 当前项的数据内容。
         */
        target: Readonly<Ref<Album | null>>
        /**
         * 对当前项的数据进行修改。很少需要调用此方法。
         */
        setTargetData(form: TargetDataForm): Promise<boolean>
        /**
         * 删除当前项。
         */
        deleteTarget(): Promise<boolean>
        /**
         * 发送一个标记给view的上级，告知当前view做了一些大动作修改illust列表的操作，因此需要重新加载列表
         */
        toastRefresh(): void
    }
    /**
     * 当前所引用的album的图像列表。
     */
    images: {
        dataView: PaginationDataView<AlbumImage>
        endpoint: QueryEndpointResult<AlbumImage>
        scrollView: Readonly<ScrollView>
        viewController: Exclude<IllustDatasetController, "collectionMode"> & { editable: Ref<boolean> }
        selector: SelectedState
        pane: SidePaneState
    }
    /**
     * sidebar detail info的数据。
     */
    detailInfo: ObjectEndpoint<DetailAlbum, AlbumUpdateForm, AlbumExceptions["update"]>
    /**
     * UI状态。
     */
    ui: {
        /**
         * 当前抽屉正在显示的tab。
         */
        drawerTab: Ref<"metaTag" | undefined>
    }
}

interface TargetDataForm {
    title?: string
    favorite?: boolean
    thumbnailFile?: string | null
    imageCount?: number
}

export const [installPreviewContext, usePreviewContext] = installation(function (singletonDataView: SingletonDataView<Album>, onToastRefresh: () => void): PreviewContext {
    const data = useDataContext(singletonDataView, onToastRefresh)
    const images = useImagesContext(data.id)
    const detailInfo = useDetailInfoEndpoint(data.id)
    const drawerTab = ref<"metaTag">()

    return {data, images, detailInfo, ui: {drawerTab}}
})

function useDataContext(data: SingletonDataView<Album>, toastRefresh: () => void): PreviewContext["data"] {
    const { setData, deleteData } = useFastObjectEndpoint({
        update: httpClient => httpClient.album.update,
        delete: httpClient => httpClient.album.delete
    })

    const target = ref<Album | null>(null)
    const id = computed(() => target.value?.id ?? null)

    const setTargetData = async (form: TargetDataForm): Promise<boolean> => {
        if(target.value !== null) {
            //只有一部分属性需要调API更新数据库，所以加一个||判断条件
            const ok = (form.favorite === undefined) || await setData(target.value.id, form)
            if(ok) {
                if(form.title !== undefined) target.value.title = form.title
                if(form.favorite !== undefined) target.value.favorite = form.favorite
                if(form.thumbnailFile !== undefined) target.value.thumbnailFile = form.thumbnailFile
                if(form.imageCount !== undefined) target.value.imageCount = form.imageCount
                data.syncOperations.modify({...target.value})
            }
            return ok
        }else{
            return false
        }
    }

    const deleteTarget = async (): Promise<boolean> => {
        if(target.value !== null) {
            const ok = await deleteData(target.value.id)
            if(ok) {
                data.syncOperations.remove()
            }
            return ok
        }else{
            return false
        }
    }

    onBeforeMount(async () => target.value = await data.get() ?? null)

    return {id, target, setTargetData, deleteTarget, toastRefresh}
}

function useImagesContext(id: Ref<number | null>): PreviewContext["images"] {
    const list = useListContext(id)

    const viewController = {
        ...useIllustDatasetController(),
        editable: useLocalStorageWithDefault<boolean>("album-detail/editable", false)
    }

    const selector = useSelectedState(list.endpoint)

    const pane = useSidePaneState("illust", selector)

    return {...list, viewController, selector, pane}
}

function useListContext(path: Ref<number | null>) {
    const { handleError } = useToast()
    const httpClient = useHttpClient()
    const scrollView = useScrollView()

    const endpoint = useQueryEndpoint({
        filter: path,
        request: async (offset, limit, path) => {
            if(path === null) {
                return {ok: true, status: 200, data: {total: 0, result: []}}
            }
            return await httpClient.album.images.get(path, {offset, limit})
        },
        handleError
    })
    const dataView = usePaginationDataView(endpoint)

    return {endpoint, dataView, scrollView}
}

function useDetailInfoEndpoint(path: Ref<number | null>) {
    return useObjectEndpoint({
        path,
        get: httpClient => httpClient.album.get,
        update: httpClient => httpClient.album.update,
        delete: httpClient => httpClient.album.delete
    })
}
