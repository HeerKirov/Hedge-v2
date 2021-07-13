import { computed, ref, Ref, watch } from "vue"
import {
    Illust,
    DetailIllust, ImageOriginData, ImageRelatedItems,
    ImageUpdateForm, ImageOriginUpdateForm, ImageRelatedUpdateForm
} from "@/functions/adapter-http/impl/illust"
import { QueryEndpointInstance } from "@/functions/utils/endpoints/query-endpoint"
import { ObjectEndpoint, useObjectEndpoint } from "@/functions/utils/endpoints/object-endpoint"
import { useHttpClient } from "@/functions/app"
import { useNotification } from "@/functions/document/notification"
import { installation } from "@/functions/utils/basic"

export interface DetailViewContext {
    data: DataAccessor
    navigator: {
        metrics: Readonly<Ref<{ total: number, current: number }>>
        metricsOfCollection: Readonly<Ref<{ total: number, current: number } | null>>
        prev(): void
        prevWholeIllust(): void
        next(): void
        nextWholeIllust(): void
    }
    detail: Targets & {
        //TODO 优化为lazy load
        metadata: ObjectEndpoint<DetailIllust, ImageUpdateForm>
        relatedItems: ObjectEndpoint<ImageRelatedItems, ImageRelatedUpdateForm>
        originData: ObjectEndpoint<ImageOriginData, ImageOriginUpdateForm>
    }
}

interface Targets {
    target: Readonly<Ref<Illust | null>>
    collectionItems: Readonly<Ref<Illust[] | null>>
}

interface DataAccessor {
    count(): number
    get(index: number): Promise<Illust | undefined>
}

export const [installDetailViewContext, useDetailViewContext] = installation(function (queryEndpoint: QueryEndpointInstance<Illust> | Illust[], initIndex: Ref<number>): DetailViewContext {
    const data = createDataAccessor(queryEndpoint)
    const { target, collectionItems, ...navigator } = useNavigator(data, initIndex)

    const path = computed(() => target.value?.id ?? null)

    const detailEndpoints = useDetailEndpoints(path)

    return {
        data,
        navigator,
        detail: {
            target,
            collectionItems,
            ...detailEndpoints
        }
    }
})

function useNavigator(data: DataAccessor, initIndex: Ref<number>): DetailViewContext["navigator"] & Targets {
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
            target.value = res
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
            target.value = collectionItems.value[index]
        }
    })

    const metrics = computed(() => ({total: data.count(), current: currentIndex.value}))
    const metricsOfCollection = computed(() => collectionItems.value !== null && currentIndexOfCollection.value !== null ? {total: collectionItems.value.length, current: currentIndexOfCollection.value} : null)

    const prev = () => {
        if(currentIndexOfCollection.value !== null && collectionItems.value !== null && currentIndexOfCollection.value > 0) {
            currentIndexOfCollection.value -= 1
        }else{
            prevWholeIllust()
        }
    }
    const prevWholeIllust = () => {
        if(currentIndex.value > 0) {
            currentIndex.value -= 1
        }
    }
    const next = () => {
        if(currentIndexOfCollection.value !== null && collectionItems.value !== null && currentIndexOfCollection.value < collectionItems.value.length - 1) {
            currentIndexOfCollection.value += 1
        }else{
            nextWholeIllust()
        }
    }
    const nextWholeIllust = () => {
        if(currentIndex.value < data.count() - 1) {
            currentIndex.value += 1
        }
    }

    return {
        metrics,
        metricsOfCollection,
        prev,
        prevWholeIllust,
        next,
        nextWholeIllust,
        target,
        collectionItems
    }
}

function useDetailEndpoints(path: Ref<number | null>) {
    const metadata = useObjectEndpoint({
        path,
        get: httpClient => httpClient.illust.image.get,
        update: httpClient => httpClient.illust.image.update,
        delete: httpClient => httpClient.illust.image.delete
    })

    const relatedItems = useObjectEndpoint({
        path,
        get: httpClient => id => httpClient.illust.image.relatedItems.get(id, {limit: 9}),
        update: httpClient => httpClient.illust.image.relatedItems.update
    })

    const originData = useObjectEndpoint({
        path,
        get: httpClient => httpClient.illust.image.originData.get,
        update: httpClient => httpClient.illust.image.originData.update
    })

    return {metadata, relatedItems, originData}
}

function createDataAccessor(queryEndpoint: QueryEndpointInstance<Illust> | Illust[]): DataAccessor {
    if(queryEndpoint instanceof Array) {
        return {
            get: async index => queryEndpoint[index],
            count: () => queryEndpoint.length
        }
    }else{
        return {
            get: queryEndpoint.queryOne,
            count: () => queryEndpoint.count()!
        }
    }
}
