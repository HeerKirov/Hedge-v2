import { ref, Ref } from "vue"
import { ListResult } from "@/functions/adapter-http/impl/generic"
import { Illust } from "@/functions/adapter-http/impl/illust"
import { DetailTopic, TopicExceptions, TopicUpdateForm } from "@/functions/adapter-http/impl/topic"
import { ObjectEndpoint, useObjectEndpoint } from "@/functions/endpoints/object-endpoint"
import { installation } from "@/functions/utils/basic"
import { useTopicContext } from "../inject"


type Endpoint = ObjectEndpoint<DetailTopic, TopicUpdateForm, TopicExceptions["update"]>

export interface TopicDetailContext {
    data: Endpoint["data"]
    setData: Endpoint["setData"]
    deleteData: Endpoint["deleteData"]
    exampleData: Ref<ListResult<Illust> | null>
    editMode: Ref<boolean>
}

export const [installTopicDetailContext, useTopicDetailContext] = installation(function(): TopicDetailContext {
    const { dataView, detailMode } = useTopicContext()

    const { data, setData, deleteData } = useObjectEndpoint({
        path: detailMode,
        get: httpClient => httpClient.topic.get,
        update: httpClient => httpClient.topic.update,
        delete: httpClient => httpClient.topic.delete,
        afterUpdate(id, data: DetailTopic) {
            const index = dataView.proxy.syncOperations.find(topic => topic.id === id)
            if(index != undefined) dataView.proxy.syncOperations.modify(index, data)
        }
    })

    const attachData = useAttachDetailData(detailMode)

    const editMode = ref(false)

    return {data, setData, deleteData, ...attachData, editMode}
})

function useAttachDetailData(detailMode: Ref<number | null>) {
    const { data: exampleData } = useObjectEndpoint({
        path: detailMode,
        get: httpClient => async (topic: number) => await httpClient.illust.list({limit: EXAMPLE_LIMIT, topic, type: "IMAGE", order: "-orderTime"})
    })

    return {exampleData}
}

const EXAMPLE_LIMIT = 10
