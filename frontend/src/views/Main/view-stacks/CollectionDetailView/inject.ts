import { computed, InjectionKey, onBeforeMount, ref, Ref, watch } from "vue"
import { FitType } from "@/layouts/data/IllustGrid"
import { ScrollView, useScrollView } from "@/components/features/VirtualScrollView"
import { useToast } from "@/functions/module/toast"
import { useHttpClient, useLocalStorageWithDefault } from "@/functions/app"
import { CollectionRelatedItems, CollectionRelatedUpdateForm, CollectionUpdateForm, DetailIllust, Illust, IllustExceptions, } from "@/functions/adapter-http/impl/illust"
import { PaginationDataView, QueryEndpointResult, SingletonDataView, usePaginationDataView, useQueryEndpoint } from "@/functions/utils/endpoints/query-endpoint"
import { installObjectLazyObject, ObjectLazyObjectInjection, useObjectLazyObject } from "@/functions/utils/endpoints/object-lazy-endpoint"
import { useFastObjectEndpoint } from "@/functions/utils/endpoints/object-fast-endpoint"
import { installation, splitRef } from "@/functions/utils/basic"
import { useListeningEvent } from "@/functions/utils/emitter"

export interface PreviewContext {
    /**
     * 当前所引用的collection原始对象的数据和操作。
     */
    data: {
        /**
         * collection id。
         */
        id: Readonly<Ref<number | null>>
        /**
         * 当前项的数据内容。
         */
        target: Readonly<Ref<Illust | null>>
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
     * 当前所引用的collection的图像列表的数据和操作。
     */
    images: {
        dataView: PaginationDataView<Illust>
        endpoint: QueryEndpointResult<Illust>
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
    ui: {
        /**
         * 当前抽屉正在显示的tab。
         */
        drawerTab: Ref<"metaTag" | undefined>
    }
}

interface TargetDataForm {
    favorite?: boolean
    thumbnailFile?: string
    childrenCount?: number
}

export const [installPreviewContext, usePreviewContext] = installation(function (singletonDataView: SingletonDataView<Illust>, onToastRefresh: () => void): PreviewContext {
    const data = useDataContext(singletonDataView, onToastRefresh)
    const images = useImagesContext(data.id)

    installSideBarEndpoints(data.id)

    const drawerTab = ref<"metaTag">()

    return { data, images, ui: { drawerTab } }
})

function useDataContext(data: SingletonDataView<Illust>, toastRefresh: () => void): PreviewContext["data"] {
    const { setData, deleteData } = useFastObjectEndpoint({
        update: httpClient => httpClient.illust.collection.update,
        delete: httpClient => httpClient.illust.collection.delete
    })

    const target = ref<Illust | null>(null)
    const id = computed(() => target.value?.id ?? null)

    const setTargetData = async (form: TargetDataForm): Promise<boolean> => {
        if(target.value !== null) {
            //只有一部分属性需要调API更新数据库，所以加一个||判断条件
            const ok = (form.favorite === undefined) || await setData(target.value.id, form)
            if(ok) {
                if(form.favorite !== undefined) target.value.favorite = form.favorite
                if(form.thumbnailFile !== undefined) target.value.thumbnailFile = form.thumbnailFile
                if(form.childrenCount !== undefined) target.value.childrenCount = form.childrenCount
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
            return await httpClient.illust.collection.images.get(path, {offset, limit})
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
        fitType: splitRef(storage, "fitType"),
        columnNum: splitRef(storage, "columnNum")
    }
}

function useSelector(endpoint: QueryEndpointResult<Illust>) {
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

function installSideBarEndpoints(path: Ref<number | null>) {
    installObjectLazyObject(symbols.metadata, {
        path,
        get: httpClient => httpClient.illust.collection.get,
        update: httpClient => httpClient.illust.collection.update,
        delete: httpClient => httpClient.illust.collection.delete
    })

    installObjectLazyObject(symbols.relatedItems, {
        path,
        get: httpClient => id => httpClient.illust.collection.relatedItems.get(id, {limit: 9}),
        update: httpClient => httpClient.illust.collection.relatedItems.update
    })
}

export function useMetadataEndpoint() {
    return useObjectLazyObject(symbols.metadata)
}

export function useRelatedItemsEndpoint() {
    return useObjectLazyObject(symbols.relatedItems)
}

const symbols = {
    metadata: Symbol() as InjectionKey<ObjectLazyObjectInjection<number, DetailIllust, CollectionUpdateForm, IllustExceptions["collection.update"]>>,
    relatedItems: Symbol() as InjectionKey<ObjectLazyObjectInjection<number, CollectionRelatedItems, CollectionRelatedUpdateForm, IllustExceptions["collection.relatedItems.update"]>>
}
