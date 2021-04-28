import { inject, InjectionKey, provide, readonly, ref, Ref, watch } from "vue"
import { ListResult } from "@/functions/adapter-http/impl/generic"
import { Illust } from "@/functions/adapter-http/impl/illust"
import { DetailTopic, Topic, TopicUpdateForm } from "@/functions/adapter-http/impl/topic"
import { ObjectEndpoint, useObjectEndpoint } from "@/functions/utils/endpoints/object-endpoint"
import { useMessageBox } from "@/functions/module"
import { useTopicContext } from "../inject"


type Endpoint = ObjectEndpoint<DetailTopic, TopicUpdateForm>

export interface TopicDetailContext {
    data: Endpoint["data"]
    setData: Endpoint["setData"]
    deleteData: Endpoint["deleteData"]
    subThemeData: Ref<ListResult<Topic> | null>
    exampleData: Ref<ListResult<Illust> | null>
    editMode: Ref<boolean>
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

    const attachData = useAttachDetailData(detailMode)

    const editMode = ref(true)

    const context = {data, setData, deleteData, ...attachData, editMode}
    provide(contextInjection, context)
    return context
}

function useAttachDetailData(detailMode: Ref<number | null>) {
    const { data: subThemeData } = useObjectEndpoint<number, ListResult<Topic>, unknown>({
        path: detailMode,
        get: httpClient => async (path: number) => await httpClient.topic.list({limit: SUB_THEME_LIMIT, parentId: path, order: "-updateTime"})
    })

    const { data: exampleData } = useObjectEndpoint<number, ListResult<Illust>, unknown>({
        path: detailMode,
        get: httpClient => async (topic: number) => await httpClient.illust.list({limit: EXAMPLE_LIMIT, topic, type: "IMAGE", order: "-orderTime"})
    })

    return {subThemeData, exampleData}
}

const SUB_THEME_LIMIT = 10
const EXAMPLE_LIMIT = 10
