import { inject, InjectionKey, provide, Ref, ref, watch } from "vue"
import { Topic, TopicCreateForm, TopicQueryFilter } from "@/functions/adapter-http/impl/topic"
import { useHttpClient } from "@/functions/app"
import { useNotification } from "@/functions/module"
import { useScrollView, ScrollView } from "@/components/VirtualScrollView"
import { ListEndpointResult, useListEndpoint } from "@/functions/utils/endpoints/list-endpoint"
import { useRouterQueryNumber } from "@/functions/utils/properties/router-property"

export interface TopicContext {
    listEndpoint: ListEndpointResult<Topic>
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
    const { listEndpoint, scrollView, queryFilter } = useTopicList()

    const { createMode, detailMode, openCreatePane, openDetailPane, closePane } = usePane()

    const context = {listEndpoint, scrollView, queryFilter, createMode, detailMode, openCreatePane, openDetailPane, closePane}

    provide(topicContextInjection, context)

    return context
}

function useTopicList() {
    const httpClient = useHttpClient()
    const { handleError } = useNotification()

    const queryFilter = ref<TopicQueryFilter>({})
    watch(queryFilter, () => listEndpoint.refresh())

    const listEndpoint = useListEndpoint({
        async request(offset: number, limit: number) {
            const res = await httpClient.topic.list({offset, limit, ...queryFilter.value})
            return res.ok ? {ok: true, ...res.data} : {ok: false, message: res.exception?.message ?? "unknown error"}
        },
        handleError
    })

    const scrollView = useScrollView()

    return {listEndpoint, scrollView, queryFilter}
}

function usePane() {
    const createMode = ref<TopicCreateForm | null>(null)
    const detailMode = useRouterQueryNumber("MainTopics", "detail")

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