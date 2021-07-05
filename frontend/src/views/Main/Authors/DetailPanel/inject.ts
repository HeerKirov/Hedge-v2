import { ref, Ref } from "vue"
import { ListResult } from "@/functions/adapter-http/impl/generic"
import { Illust } from "@/functions/adapter-http/impl/illust"
import { DetailAuthor, AuthorUpdateForm } from "@/functions/adapter-http/impl/author"
import { ObjectEndpoint, useObjectEndpoint } from "@/functions/utils/endpoints/object-endpoint"
import { installation } from "@/functions/utils/basic"
import { useAuthorContext } from "../inject"


type Endpoint = ObjectEndpoint<DetailAuthor, AuthorUpdateForm>

export interface AuthorDetailContext {
    data: Endpoint["data"]
    setData: Endpoint["setData"]
    deleteData: Endpoint["deleteData"]
    exampleData: Ref<ListResult<Illust> | null>
    editMode: Ref<boolean>
}

export const [installAuthorDetailContext, useAuthorDetailContext] = installation(function(): AuthorDetailContext {
    const { dataView, detailMode } = useAuthorContext()

    const { data, setData, deleteData } = useObjectEndpoint<number, DetailAuthor, AuthorUpdateForm>({
        path: detailMode,
        get: httpClient => httpClient.author.get,
        update: httpClient => httpClient.author.update,
        delete: httpClient => httpClient.author.delete,
        afterUpdate(id, data) {
            const index = dataView.proxy.syncOperations.find(author => author.id === id)
            if(index != undefined) dataView.proxy.syncOperations.modify(index, data)
        }
    })

    const attachData = useAttachDetailData(detailMode)

    const editMode = ref(false)

    return {data, setData, deleteData, ...attachData, editMode}
})

function useAttachDetailData(detailMode: Ref<number | null>) {
    const { data: exampleData } = useObjectEndpoint<number, ListResult<Illust>, unknown>({
        path: detailMode,
        get: httpClient => async (author: number) => await httpClient.illust.list({limit: EXAMPLE_LIMIT, author, type: "IMAGE", order: "-orderTime"})
    })

    return {exampleData}
}

const EXAMPLE_LIMIT = 10
