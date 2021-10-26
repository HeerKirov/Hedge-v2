import { computed, onBeforeMount, ref, Ref, watch } from "vue"
import { Album, AlbumExceptions, AlbumImage, AlbumUpdateForm, DetailAlbum } from "@/functions/adapter-http/impl/album"
import { ScrollView, useScrollView } from "@/components/features/VirtualScrollView"
import { PaginationDataView, QueryEndpointResult, SingletonDataView, usePaginationDataView, useQueryEndpoint } from "@/functions/utils/endpoints/query-endpoint"
import { FitType } from "@/layouts/data/IllustGrid"
import { useToast } from "@/functions/module/toast"
import { useHttpClient, useLocalStorageWithDefault } from "@/functions/app"
import { useObjectEndpoint, ObjectEndpoint } from "@/functions/utils/endpoints/object-endpoint"
import { useFastObjectEndpoint } from "@/functions/utils/endpoints/object-fast-endpoint"
import { useListeningEvent } from "@/functions/utils/emitter"
import { installation, splitRef } from "@/functions/utils/basic"

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
        viewController: {
            fitType: Ref<FitType>
            columnNum: Ref<number>
        }
        selector: {
            selected: Ref<number[]>
            lastSelected: Ref<number | null>
        }
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
                await data.syncOperations.remove()
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

    const viewController = useViewController()

    const selector = useSelector(list.endpoint)

    return {...list, viewController, selector}
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

function useViewController() {
    const storage = useLocalStorageWithDefault<{
        fitType: FitType, columnNum: number
    }>("illust-grid/view-controller", {
        fitType: "cover", columnNum: 8
    })

    return {
        columnNum: splitRef(storage, "columnNum"),
        fitType: splitRef(storage, "fitType")
    }
}

function useSelector(endpoint: QueryEndpointResult<AlbumImage>) {
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

function useDetailInfoEndpoint(path: Ref<number | null>) {
    return useObjectEndpoint({
        path,
        get: httpClient => httpClient.album.get,
        update: httpClient => httpClient.album.update,
        delete: httpClient => httpClient.album.delete
    })
}
