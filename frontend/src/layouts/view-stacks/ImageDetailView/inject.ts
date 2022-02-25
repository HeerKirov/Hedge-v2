import { computed, InjectionKey, ref, Ref, watch } from "vue"
import {
    Illust, DetailIllust, ImageFileInfo, ImageOriginData,
    ImageOriginUpdateForm, ImageRelatedItems, ImageRelatedUpdateForm, ImageUpdateForm, IllustExceptions
} from "@/functions/adapter-http/impl/illust"
import { SliceDataView } from "@/functions/endpoints/query-endpoint"
import { installObjectLazyObject, useObjectLazyObject, ObjectLazyObjectInjection } from "@/functions/endpoints/object-lazy-endpoint"
import { useFastObjectEndpoint } from "@/functions/endpoints/object-fast-endpoint"
import { useHttpClient } from "@/services/app"
import { useToast } from "@/services/module/toast"
import { installation } from "@/functions/utils/basic"

export interface PreviewContext {
    /**
     * 当前详情视图中，引用的数据列表的列表视图。
     */
    data: SliceDataView<Illust>
    navigator: {
        /**
         * 当前一级数据列表的导航视图。
         */
        metrics: Readonly<Ref<{ total: number, current: number }>>
        /**
         * 如果当前项是集合，那么在二级列表的项的导航视图。
         */
        metricsOfCollection: Readonly<Ref<{ total: number, current: number } | null>>
        /**
         * 二级列表的上一项。
         */
        prev(): void
        /**
         * 一级列表向前几项。
         */
        prevWholeIllust(count?: number): void
        /**
         * 二级列表的下一项。
         */
        next(): void
        /**
         * 一级列表向后几项。
         */
        nextWholeIllust(count?: number): void
    }
    /**
     * 当前二级列表所引用的image对象，就是正在显示的项目。
     */
    detail: Targets
    ui: {
        /**
         * 当前抽屉正在显示的tab。
         */
        drawerTab: Ref<"metaTag" | "source" | undefined>
    }
}

interface Targets {
    /**
     * 当前项的id。
     */
    id: Readonly<Ref<number | null>>
    /**
     * 当前项的数据内容。
     */
    target: Readonly<Ref<Illust | null>>
    /**
     * 如果当前项是一个集合的二级列表，那么给出这个集合的所有项的列表。
     */
    collectionItems: Readonly<Ref<Illust[] | null>>
    /**
     * 对target的数据进行修改。很少需要调用此方法。
     */
    setTargetData(form: TargetDataForm): Promise<boolean>
    /**
     * 删除target所指的项，将指针指向下一个项目。
     */
    deleteTarget(): Promise<boolean>
}

interface TargetDataForm {
    favorite?: boolean
}

export const [installPreviewContext, usePreviewContext] = installation(function (data: SliceDataView<Illust>, initIndex: Ref<number>, onIndexCallback: (_: number) => void): PreviewContext {
    const { navigator, detail } = useNavigatorAndTarget(data, initIndex, onIndexCallback)

    installSideBarEndpoints(detail.id)

    const drawerTab = ref<"metaTag" | "source">()

    return {
        data,
        navigator,
        detail,
        ui: {
            drawerTab
        }
    }
})

function useNavigatorAndTarget(data: SliceDataView<Illust>, initIndex: Ref<number>, onIndexCallback: (_: number) => void): {navigator: PreviewContext["navigator"], detail: Targets} {
    const { toast, handleException } = useToast()
    const httpClient = useHttpClient()

    //illust级索引
    const currentIndex: Ref<number> = ref(initIndex.value)
    //illust为collection时，选中项的索引
    const currentIndexOfCollection: Ref<number | null> = ref(null)
    //illust为collection时，它是此collection的项的列表。null表示LOADING或不存在
    const collectionItems: Ref<Illust[] | null> = ref(null)
    //illust为collection时，它是根据{currentIndexOfCollection}选中的集合项; illust为image时，它与current illust一致。null表示LOADING
    const target: Ref<Illust | null> = ref(null)

    /**
     * 根据current index加载target。
     */
    const refreshByCurrentIndex = async (currentIndex: number, old?: number) => {
        target.value = null
        collectionItems.value = null
        currentIndexOfCollection.value = null

        //调用回调将当前index通知到上层
        onIndexCallback(currentIndex)

        const res = await data.get(currentIndex)
        if(res === undefined) {
            toast("错误", "danger", `无法找到索引为${currentIndex}的项目。`)
            return
        }
        if(res.type === "IMAGE") {
            //新的illust项是个image项
            target.value = {...res}
        }else{
            //新的illust项是个collection项，此时需要异步请求collection项的image列表
            const imagesRes = await httpClient.illust.collection.images.get(res.id, {})
            if(imagesRes.ok) {
                collectionItems.value = imagesRes.data.result
                //根据当前illust index与上一次的变化对比确定是在前进还是后退，从而决定显示collection的第一项还是最后一项
                currentIndexOfCollection.value = (old === undefined || currentIndex > old) ? 0 : (collectionItems.value.length - 1)
                //不需要设置currentTarget，这交给下面的watch完成
            }else if(imagesRes.exception) {
                handleException(imagesRes.exception)
            }
        }
    }

    /**
     * 根据collection current index加载target。
     */
    const refreshByCollectionIndex = (currentIndexOfCollection: number | null) => {
        if(currentIndexOfCollection !== null && collectionItems.value !== null) {
            target.value = {...collectionItems.value[currentIndexOfCollection]}
        }
    }

    /**
     * 当组件根层次的初始索引变化时，将当前illust索引修改为初始索引的值。
     */
    watch(initIndex, initIndex => {
        if(initIndex !== currentIndex.value) {
            currentIndex.value = initIndex
        }
    })

    /**
     * 当当前illust索引变化时，查询对应的illust项目。
     */
    watch(currentIndex, refreshByCurrentIndex, {immediate: true})

    /**
     * 当当前collection选中项索引发生变化时，替换target。
     */
    watch(currentIndexOfCollection, refreshByCollectionIndex)

    const id = computed(() => target.value?.id ?? null)
    const metrics = computed(() => ({total: data.count(), current: currentIndex.value}))
    const metricsOfCollection = computed(() => collectionItems.value !== null && currentIndexOfCollection.value !== null ? {total: collectionItems.value.length, current: currentIndexOfCollection.value} : null)

    const navigatorMethod = useNavigatorMethod(data, currentIndex, currentIndexOfCollection, collectionItems)

    const targetUpdater = useTargetUpdater(data, target, currentIndex, currentIndexOfCollection, collectionItems, refreshByCurrentIndex, refreshByCollectionIndex)

    return {
        navigator: {
            metrics,
            metricsOfCollection,
            ...navigatorMethod
        },
        detail: {
            id,
            target,
            collectionItems,
            ...targetUpdater
        }
    }
}

function useNavigatorMethod(data: SliceDataView<Illust>, currentIndex: Ref<number>, currentIndexOfCollection: Ref<number | null>, collectionItems: Ref<Illust[] | null>) {
    const prev = () => {
        if(currentIndexOfCollection.value !== null && collectionItems.value !== null && currentIndexOfCollection.value > 0) {
            currentIndexOfCollection.value -= 1
        }else{
            prevWholeIllust()
        }
    }
    const prevWholeIllust = (count: number = 1) => {
        if(currentIndex.value > 0) {
            if(currentIndex.value >= count) {
                currentIndex.value -= count
            }else{
                currentIndex.value = 0
            }
        }
    }
    const next = () => {
        if(currentIndexOfCollection.value !== null && collectionItems.value !== null && currentIndexOfCollection.value < collectionItems.value.length - 1) {
            currentIndexOfCollection.value += 1
        }else{
            nextWholeIllust()
        }
    }
    const nextWholeIllust = (count: number = 1) => {
        const max = data.count() - 1
        if(currentIndex.value < max) {
            if(currentIndex.value <= data.count() - count) {
                currentIndex.value += count
            }else{
                currentIndex.value = max
            }
        }
    }

    return {prev, prevWholeIllust, next, nextWholeIllust}
}

function useTargetUpdater(data: SliceDataView<Illust>, target: Ref<Illust | null>,
                          currentIndex: Ref<number>, currentIndexOfCollection: Ref<number | null>, collectionItems: Ref<Illust[] | null>,
                          refreshByIndex: (index: number) => void, refreshByCollectionIndex: (index: number) => void) {
    const { setData, deleteData } = useFastObjectEndpoint({
        update: httpClient => httpClient.illust.image.update,
        delete: httpClient => httpClient.illust.image.delete
    })

    const setTargetData = async (form: TargetDataForm) => {
        if(target.value !== null) {
            const ok = await setData(target.value.id, form)
            if(ok) {
                if(form.favorite !== undefined) target.value.favorite = form.favorite
                if(currentIndexOfCollection.value === null) {
                    //index为null，表示这个illust项直接在上级列表显示，因此需要更新上级列表
                    data.syncOperations.modify(currentIndex.value, {...target.value})
                }
            }
            return ok
        }else{
            return false
        }
    }
    const deleteTarget = async () => {
        if(target.value !== null) {
            const ok = await deleteData(target.value.id)
            if(ok) {
                if(currentIndexOfCollection.value === null) {
                    //如果是一级image项，从dataView中移除此项
                    data.syncOperations.remove(currentIndex.value)

                    if(data.count() <= 0) {
                        //此时整个列表已净空，理应已经到上一层级
                    }else if(currentIndex.value >= data.count()) {
                        //如果当前项已是最后一项，那么使currentIndex -= 1，这会自动触发target刷新
                        currentIndex.value -= 1
                    }else{
                        //如果还不是最后一项，那么强制刷新target以更新到新的illust
                        refreshByIndex(currentIndex.value)
                    }
                }else{
                    //如果是二级collection项，从项列表移除此项
                    collectionItems.value!.splice(currentIndexOfCollection.value, 1)

                    if(collectionItems.value!.length <= 0) {
                        //如果collection被净空，那么从dataView将此collection移除，并继续对一级项的判断
                        data.syncOperations.remove(currentIndex.value)
                        if(data.count() <= 0) {
                            //此时整个列表已净空，理应已经到上一层级
                        }else if(currentIndex.value >= data.count()) {
                            currentIndex.value -= 1
                        }else{
                            refreshByIndex(currentIndex.value)
                        }
                    }else{
                        if(currentIndexOfCollection.value >= collectionItems.value!.length) {
                            //如果当前项已是最后一项，那么使currentIndexOfCollection -= 1，这会自动触发target刷新
                            currentIndexOfCollection.value -= 1
                        }else{
                            //如果还不是最后一项，那么强制刷新target以更新到新的image
                            refreshByCollectionIndex(currentIndexOfCollection.value)
                        }

                        const col = await data.get(currentIndex.value)
                        if(col !== undefined) {
                            //在dataView中修改此项的children count，减少1
                            const newIllust: Illust = {...col, childrenCount: col.childrenCount! - 1}
                            //如果被移除的项是第一项，那么collection的cover需要顺延至下一个
                            if(currentIndexOfCollection.value === 0) {
                                const nextCover = collectionItems.value![0]
                                newIllust.file = nextCover.file
                                newIllust.thumbnailFile = nextCover.thumbnailFile
                            }

                            data.syncOperations.modify(currentIndex.value, newIllust)
                        }
                    }
                }
            }
            return ok
        }else{
            return false
        }
    }

    return {setTargetData, deleteTarget}
}

function installSideBarEndpoints(path: Ref<number | null>) {
    installObjectLazyObject(symbols.metadata, {
        path,
        get: httpClient => httpClient.illust.image.get,
        update: httpClient => httpClient.illust.image.update,
        delete: httpClient => httpClient.illust.image.delete
    })

    installObjectLazyObject(symbols.relatedItems, {
        path,
        get: httpClient => id => httpClient.illust.image.relatedItems.get(id, {limit: 9}),
        update: httpClient => httpClient.illust.image.relatedItems.update
    })

    installObjectLazyObject(symbols.originData, {
        path,
        get: httpClient => httpClient.illust.image.originData.get,
        update: httpClient => httpClient.illust.image.originData.update
    })

    installObjectLazyObject(symbols.fileInfo, {
        path,
        get: httpClient => httpClient.illust.image.fileInfo.get
    })
}

export function useMetadataEndpoint() {
    return useObjectLazyObject(symbols.metadata)
}

export function useRelatedItemsEndpoint() {
    return useObjectLazyObject(symbols.relatedItems)
}

export function useOriginDataEndpoint() {
    return useObjectLazyObject(symbols.originData)
}

export function useFileInfoEndpoint() {
    return useObjectLazyObject(symbols.fileInfo)
}

const symbols = {
    metadata: Symbol() as InjectionKey<ObjectLazyObjectInjection<number, DetailIllust, ImageUpdateForm, IllustExceptions["image.update"]>>,
    relatedItems: Symbol() as InjectionKey<ObjectLazyObjectInjection<number, ImageRelatedItems, ImageRelatedUpdateForm, IllustExceptions["image.relatedItems.update"]>>,
    originData: Symbol() as InjectionKey<ObjectLazyObjectInjection<number, ImageOriginData, ImageOriginUpdateForm, IllustExceptions["image.originData.update"]>>,
    fileInfo: Symbol() as InjectionKey<ObjectLazyObjectInjection<number, ImageFileInfo, unknown, never>>
}
