import { inject, InjectionKey, provide } from "vue"
import { DetailTopic, TopicUpdateForm } from "@/functions/adapter-http/impl/topic"
import { ObjectEndpoint, useObjectEndpoint } from "@/functions/utils/object-endpoint"
import { useMessageBox } from "@/functions/message"
import { useTopicContext } from "../inject"


type Endpoint = ObjectEndpoint<DetailTopic, TopicUpdateForm>

export interface TopicDetailContext {
    data: Endpoint["data"]
    setData: Endpoint["setData"]
    deleteData: Endpoint["deleteData"]
}

const contextInjection: InjectionKey<TopicDetailContext> = Symbol()

export function useTopicDetailContext(): TopicDetailContext {
    return inject(contextInjection)!
}

export function installTopicDetailContext(): TopicDetailContext {
    const message = useMessageBox()
    const { dataEndpoint, detailMode } = useTopicContext()

    const { data, setData, deleteData } = useObjectEndpoint<number, DetailTopic, TopicUpdateForm>({
        path: detailMode,
        get: httpClient => httpClient.topic.get,
        update: httpClient => httpClient.topic.update,
        delete: httpClient => httpClient.topic.delete,
        afterUpdate(id, data) {
            const index = dataEndpoint.operations.find(topic => topic.id === id)
            if(index != undefined) dataEndpoint.operations.modify(index, data)
        }
    })

    const context = {data, setData, deleteData}

    provide(contextInjection, context)

    return context
}