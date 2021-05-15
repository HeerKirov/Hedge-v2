import { Ref, ref, watch } from "vue"
import { DetailAuthor, Author, AuthorQueryFilter } from "@/functions/adapter-http/impl/author"
import { useHttpClient } from "@/functions/app"
import { useNotification } from "@/functions/module"
import { useScrollView, ScrollView } from "@/components/features/VirtualScrollView"
import { ListEndpointResult, useListEndpoint } from "@/functions/utils/endpoints/list-endpoint"
import { useRouterQueryNumber } from "@/functions/utils/properties/router-property"
import { installation } from "@/functions/utils/basic"

export interface AuthorContext {
    listEndpoint: ListEndpointResult<Author>
    scrollView: Readonly<ScrollView>
    queryFilter: Ref<AuthorQueryFilter>
    createMode: Readonly<Ref<Partial<DetailAuthor> | null>>
    detailMode: Readonly<Ref<number | null>>
    openCreatePane(template?: Partial<DetailAuthor>)
    openDetailPane(id: number)
    closePane()
}

export const [installAuthorContext, useAuthorContext] = installation(function(): AuthorContext {
    const { listEndpoint, scrollView, queryFilter } = useAuthorList()

    const { createMode, detailMode, openCreatePane, openDetailPane, closePane } = usePane()

    return {listEndpoint, scrollView, queryFilter, createMode, detailMode, openCreatePane, openDetailPane, closePane}
})

function useAuthorList() {
    const httpClient = useHttpClient()
    const { handleError } = useNotification()

    const queryFilter = ref<AuthorQueryFilter>({})
    watch(queryFilter, () => listEndpoint.refresh(), {deep: true})

    const listEndpoint = useListEndpoint({
        async request(offset: number, limit: number) {
            const res = await httpClient.author.list({offset, limit, ...queryFilter.value})
            return res.ok ? {ok: true, ...res.data} : {ok: false, message: res.exception?.message ?? "unknown error"}
        },
        handleError
    })

    const scrollView = useScrollView()

    return {listEndpoint, scrollView, queryFilter}
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
