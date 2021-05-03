import { Ref, ref, watch } from "vue"
import { Topic, TopicQueryFilter } from "@/functions/adapter-http/impl/topic"
import { useHttpClient } from "@/functions/app"
import { useNotification } from "@/functions/module"
import { useScrollView, ScrollView } from "@/components/functions/VirtualScrollView"
import { ListEndpointResult, useListEndpoint } from "@/functions/utils/endpoints/list-endpoint"
import { useRouterQueryNumber } from "@/functions/utils/properties/router-property"
import { installation } from "@/functions/utils/basic"
import { CreatorData } from "./DetailPanel/CreatePanel"

export interface TopicContext {
    listEndpoint: ListEndpointResult<Topic>
    scrollView: Readonly<ScrollView>
    queryFilter: Ref<TopicQueryFilter>
    createMode: Readonly<Ref<CreatorData | null>>
    detailMode: Readonly<Ref<number | null>>
    openCreatePane(template?: CreatorData)
    openDetailPane(id: number)
    closePane()
}

export const [installTopicContext, useTopicContext] = installation(function(): TopicContext {
    const { listEndpoint, scrollView, queryFilter } = useTopicList()

    const { createMode, detailMode, openCreatePane, openDetailPane, closePane } = usePane()

    return {listEndpoint, scrollView, queryFilter, createMode, detailMode, openCreatePane, openDetailPane, closePane}
})

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
    const createMode = ref<CreatorData | null>(null)
    const detailMode = useRouterQueryNumber("MainTopics", "detail")

    const openCreatePane = (template?: CreatorData) => {
        createMode.value = template ?? DEFAULT_CREATOR_DATA
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

const DEFAULT_CREATOR_DATA: CreatorData = {
    name: "",
    otherNames: [],
    type: "UNKNOWN",
    parent: null,
    annotations: [],
    keywords: [],
    description: "",
    favorite: false,
    links: [],
    score: null
}
