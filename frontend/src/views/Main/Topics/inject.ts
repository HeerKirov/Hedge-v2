import { inject, InjectionKey, provide, Ref, ref, watch } from "vue"
import { Topic, TopicCreateForm, TopicQueryFilter } from "@/functions/adapter-http/impl/topic"
import { useHttpClient } from "@/functions/service"
import { useNotification } from "@/functions/message"
import { useScrollView, ScrollView } from "@/components/VirtualScrollView"
import { DataEndpointResult, useDataEndpoint } from "@/functions/utils/data-endpoint"

export interface TopicContext {
    dataEndpoint: DataEndpointResult<Topic>
    scrollView: Readonly<ScrollView>
    queryFilter: Ref<TopicQueryFilter>
    createMode: Readonly<Ref<TopicCreateForm | null>>
    detailMode: Readonly<Ref<number | null>>
    openCreatePane(template?: TopicCreateForm)
    openDetailPane(id: number)
    closePane()
}

const topicContextInjection: InjectionKey<TopicContext> = Symbol()

export function useTopicContext(): TopicContext {
    return inject(topicContextInjection)!
}

export function installTopicContext(): TopicContext {
    const { dataEndpoint, scrollView, queryFilter } = useTopicList()

    const { createMode, detailMode, openCreatePane, openDetailPane, closePane } = usePane()

    const context = {dataEndpoint, scrollView, queryFilter, createMode, detailMode, openCreatePane, openDetailPane, closePane}

    provide(topicContextInjection, context)

    return context
}

function useTopicList() {
    const httpClient = useHttpClient()
    const { handleError } = useNotification()

    const queryFilter = ref<TopicQueryFilter>({})
    watch(queryFilter, () => dataEndpoint.refresh())

    const dataEndpoint = useDataEndpoint({
        async request(offset: number, limit: number) {
            const res = await httpClient.topic.list({offset, limit, ...queryFilter.value})
            return res.ok ? {ok: true, ...res.data} : {ok: false, message: res.exception?.message ?? "unknown error"}
        },
        handleError
    })

    const scrollView = useScrollView()

    return {dataEndpoint, scrollView, queryFilter}
}

function usePane() {
    const createMode = ref<TopicCreateForm | null>(null)
    const detailMode = ref<number | null>(2)

    const openCreatePane = (template?: TopicCreateForm) => {
        createMode.value = template ?? { name: "" }
        detailMode.value = null
    }
    const openDetailPane = (id: number) => {
        createMode.value = null
        detailMode.value = id
    }
    const closePane = () => {
        createMode.value = null
        detailMode.value = null
    }

    return {createMode, detailMode, openCreatePane, openDetailPane, closePane}
}