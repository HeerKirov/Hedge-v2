import { Ref, ref } from "vue"
import { DetailAuthor, Author, AuthorQueryFilter } from "@/functions/adapter-http/impl/author"
import { useHttpClient } from "@/functions/app"
import { useNotification } from "@/functions/module"
import { useScrollView, ScrollView } from "@/components/features/VirtualScrollView"
import { PaginationDataView, QueryEndpointResult, usePaginationDataView, useQueryEndpoint } from "@/functions/utils/endpoints/query-endpoint"
import { useRouterQueryNumber } from "@/functions/utils/properties/router-property"
import { installation } from "@/functions/utils/basic"

export interface AuthorContext {
    endpoint: QueryEndpointResult<Author>
    dataView: PaginationDataView<Author>
    scrollView: Readonly<ScrollView>
    queryFilter: Ref<AuthorQueryFilter>
    createMode: Readonly<Ref<Partial<DetailAuthor> | null>>
    detailMode: Readonly<Ref<number | null>>
    openCreatePane(template?: Partial<DetailAuthor>)
    openDetailPane(id: number)
    closePane()
}

export const [installAuthorContext, useAuthorContext] = installation(function(): AuthorContext {
    const { endpoint, dataView, scrollView, queryFilter } = useAuthorList()

    const { createMode, detailMode, openCreatePane, openDetailPane, closePane } = usePane()

    return {endpoint, dataView, scrollView, queryFilter, createMode, detailMode, openCreatePane, openDetailPane, closePane}
})

function useAuthorList() {
    const httpClient = useHttpClient()
    const { handleError } = useNotification()

    const queryFilter = ref<AuthorQueryFilter>({})

    const endpoint = useQueryEndpoint({
        filter: queryFilter,
        async request(offset: number, limit: number, filter: AuthorQueryFilter) {
            const res = await httpClient.author.list({offset, limit, ...filter})
            return res.ok ? {ok: true, ...res.data} : {ok: false, message: res.exception?.message ?? "unknown error"}
        },
        handleError
    })
    const dataView = usePaginationDataView(endpoint)

    const scrollView = useScrollView()

    return {endpoint, dataView, scrollView, queryFilter}
}

function usePane() {
    const createMode = ref<Partial<DetailAuthor> | null>(null)
    const detailMode = useRouterQueryNumber("MainAuthors", "detail")

    const openCreatePane = (template?: Partial<DetailAuthor>) => {
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
