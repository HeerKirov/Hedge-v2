import { inject, InjectionKey, provide } from "vue"
import { DetailTopic, TopicUpdateForm } from "@/functions/adapter-http/impl/topic"
import { ObjectEndpoint, useObjectEndpoint } from "@/functions/utils/endpoints/object-endpoint"
import { useMessageBox } from "@/functions/module"
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
    const { listEndpoint, detailMode } = useTopicContext()

    const { data, setData, deleteData } = useObjectEndpoint<number, DetailTopic, TopicUpdateForm>({
        path: detailMode,
        get: httpClient => httpClient.topic.get,
        update: httpClient => httpClient.topic.update,
        delete: httpClient => httpClient.topic.delete,
        afterUpdate(id, data) {
            const index = listEndpoint.operations.find(topic => topic.id === id)
            if(index != undefined) listEndpoint.operations.modify(index, data)
        }
    })

    const context = {data, setData, deleteData}

    provide(contextInjection, context)

    return context
}