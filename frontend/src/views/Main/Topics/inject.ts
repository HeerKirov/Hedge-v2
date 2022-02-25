import { Ref, ref } from "vue"
import { useScrollView, ScrollView } from "@/components/logicals/VirtualScrollView"
import { DetailTopic, Topic, TopicQueryFilter } from "@/functions/adapter-http/impl/topic"
import { PaginationDataView, QueryEndpointResult, usePaginationDataView, useQueryEndpoint } from "@/functions/endpoints/query-endpoint"
import { useHttpClient } from "@/services/app"
import { useToast } from "@/services/module/toast"
import { useRouterQueryNumber } from "@/services/global/router"
import { installation } from "@/functions/utils/basic"

export interface TopicContext {
    dataView: PaginationDataView<Topic>
    endpoint: QueryEndpointResult<Topic>
    scrollView: Readonly<ScrollView>
    queryFilter: Ref<TopicQueryFilter>
    createMode: Readonly<Ref<Partial<DetailTopic> | null>>
    detailMode: Readonly<Ref<number | null>>
    openCreatePane(template?: Partial<DetailTopic>)
    openDetailPane(id: number)
    closePane()
}

export const [installTopicContext, useTopicContext] = installation(function(): TopicContext {
    const { endpoint, dataView, scrollView, queryFilter } = useTopicList()

    const { createMode, detailMode, openCreatePane, openDetailPane, closePane } = usePane()

    return {endpoint, dataView, scrollView, queryFilter, createMode, detailMode, openCreatePane, openDetailPane, closePane}
})

function useTopicList() {
    const httpClient = useHttpClient()
    const { handleError } = useToast()

    const queryFilter = ref<TopicQueryFilter>({})

    const endpoint = useQueryEndpoint({
        filter: queryFilter,
        request: (offset, limit, filter) => httpClient.topic.list({offset, limit, ...filter}),
        handleError
    })
    const dataView = usePaginationDataView(endpoint)

    const scrollView = useScrollView()

    return {endpoint, dataView, scrollView, queryFilter}
}

function usePane() {
    const createMode = ref<Partial<DetailTopic> | null>(null)
    const detailMode = useRouterQueryNumber("MainTopics", "detail")

    const openCreatePane = (template?: Partial<DetailTopic>) => {
        createMode.value = template ? {...template} : {}
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
