import { computed, InjectionKey, ref, Ref, watch } from "vue"
import {
    Illust, DetailIllust, ImageFileInfo, ImageOriginData,
    ImageOriginUpdateForm, ImageRelatedItems, ImageRelatedUpdateForm, ImageUpdateForm
} from "@/functions/adapter-http/impl/illust"
import { SliceDataView } from "@/functions/utils/endpoints/query-endpoint"
import { installObjectLazyObject, ObjectLazyObjectInjection, useObjectLazyObject } from "@/functions/utils/endpoints/object-lazy-endpoint"
import { useHttpClient } from "@/functions/app"
import { useNotification } from "@/functions/document/notification"
import { installation } from "@/functions/utils/basic"

export interface DetailViewContext {
    data: SliceDataView<Illust>
    navigator: {
        metrics: Readonly<Ref<{ total: number, current: number }>>
        metricsOfCollection: Readonly<Ref<{ total: number, current: number } | null>>
        prev(): void
        prevWholeIllust(count?: number): void
        next(): void
        nextWholeIllust(count?: number): void
    }
    detail: Targets
    ui: {
        drawerTab: Ref<"metaTag" | undefined>
    }
}

interface Targets {
    id: Readonly<Ref<number | null>>
    target: Readonly<Ref<Illust | null>>
    collectionItems: Readonly<Ref<Illust[] | null>>
    setTargetData(newData: Illust): void
}

export const [installDetailViewContext, useDetailViewContext] = installation(function (data: SliceDataView<Illust>, initIndex: Ref<number>): DetailViewContext {
    const { id, target, collectionItems, setTargetData, ...navigator } = useNavigator(data, initIndex)

    installDetailEndpoints(id)

    const drawerTab = ref<"metaTag">("metaTag") //TODO test

    return {
        data,
        navigator,
        detail: {
            id,
            target,
            collectionItems,
            setTargetData
        },
        ui: {
            drawerTab
        }
    }
})

function useNavigator(data: SliceDataView<Illust>, initIndex: Ref<number>): DetailViewContext["navigator"] & Targets {
    const { notify, handleException } = useNotification()
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
    watch(currentIndex, async (currentIllustIndex, old) => {
        target.value = null
        collectionItems.value = null
        currentIndexOfCollection.value = null

        const res = await data.get(currentIllustIndex)
        if(res === undefined) {
            notify("错误", "danger", `无法找到索引为${currentIllustIndex}的项目。`)
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
                currentIndexOfCollection.value = old === undefined || currentIllustIndex > old ? 0 : collectionItems.value.length - 1
                //不需要设置currentTarget，这交给下面的watch完成
            }else if(imagesRes.exception) {
                handleException(imagesRes.exception)
            }
        }
    }, {immediate: true})

    /**
     * 当当前collection选中项索引发生变化时，替换target。
     */
    watch(currentIndexOfCollection, index => {
        if(index !== null && collectionItems.value !== null) {
            target.value = {...collectionItems.value[index]}
        }
    })

    const id = computed(() => target.value?.id ?? null)
    const metrics = computed(() => ({total: data.count(), current: currentIndex.value}))
    const metricsOfCollection = computed(() => collectionItems.value !== null && currentIndexOfCollection.value !== null ? {total: collectionItems.value.length, current: currentIndexOfCollection.value} : null)

    const { prev, prevWholeIllust, next, nextWholeIllust } = useNavigatorFunc(data, currentIndex, currentIndexOfCollection, collectionItems)

    const setTargetData = useSetTargetData(data, currentIndex, currentIndexOfCollection, target)

    return {
        metrics,
        metricsOfCollection,
        prev,
        prevWholeIllust,
        next,
        nextWholeIllust,
        id,
        target,
        collectionItems,
        setTargetData
    }
}

function useNavigatorFunc(data: SliceDataView<Illust>, currentIndex: Ref<number>, currentIndexOfCollection: Ref<number | null>, collectionItems: Ref<Illust[] | null>) {
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

function useSetTargetData(data: SliceDataView<Illust>, currentIndex: Ref<number>, currentIndexOfCollection: Ref<number | null>, target: Ref<Illust | null>) {
    return (newData: Illust) => {
        if(target !== null) {
            target.value = newData
            if(currentIndexOfCollection.value === null) {
                data.syncOperations.modify(currentIndex.value, {...target.value})
            }
        }
    }
}

function installDetailEndpoints(path: Ref<number | null>) {
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
    metadata: Symbol() as InjectionKey<ObjectLazyObjectInjection<number, DetailIllust, ImageUpdateForm>>,
    relatedItems: Symbol() as InjectionKey<ObjectLazyObjectInjection<number, ImageRelatedItems, ImageRelatedUpdateForm>>,
    originData: Symbol() as InjectionKey<ObjectLazyObjectInjection<number, ImageOriginData, ImageOriginUpdateForm>>,
    fileInfo: Symbol() as InjectionKey<ObjectLazyObjectInjection<number, ImageFileInfo, unknown>>
}
