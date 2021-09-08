import { h, readonly, ref, Ref, watch } from "vue"
import { DetailIllust } from "@/functions/adapter-http/impl/illust"
import { SimpleTag } from "@/functions/adapter-http/impl/tag"
import { SimpleTopic, Topic } from "@/functions/adapter-http/impl/topic"
import { Author, SimpleAuthor } from "@/functions/adapter-http/impl/author"
import { useNotification } from "@/functions/document/notification"
import { useHttpClient, useLocalStorageWithDefault } from "@/functions/app"
import { useContinuousEndpoint } from "@/functions/utils/endpoints/continuous-endpoint"
import { installation, splitRef } from "@/functions/utils/basic"
import { useMetadataEndpoint } from "../../inject"
import { MetaTagValidation } from "@/functions/adapter-http/impl/util-meta";

export const [installPanelContext, usePanelContext] = installation(function() {
    const { data, setData } = useMetadataEndpoint()

    const typeFilter = useLocalStorageWithDefault("detail-view/meta-tag-editor/type-filter", {tag: true, author: true, topic: true})

    const editorData = useEditorData(data)

    const rightColumnData = useRightColumnData()

    return {typeFilter, editorData, rightColumnData}
})

function useEditorData(data: Ref<DetailIllust | null>) {
    const tags = ref<SimpleTag[]>([])
    const topics = ref<SimpleTopic[]>([])
    const authors = ref<SimpleAuthor[]>([])

    watch(data, d => {
        tags.value = d?.tags?.filter(t => !t.isExported) ?? []
        topics.value = d?.topics?.filter(t => !t.isExported) ?? []
        authors.value = d?.authors?.filter(t => !t.isExported) ?? []
    }, {immediate: true})

    interface MetaTagReflection {
        tag: SimpleTag
        topic: SimpleTopic
        author: SimpleAuthor
    }

    function add<T extends keyof MetaTagReflection>(type: T, metaTag: MetaTagReflection[T]) {
        if(type === "tag") {
            const tag = metaTag as SimpleTag
            if(!tags.value.find(i => i.id === tag.id)) {
                tags.value.splice(tags.value.length, 0, tag)
            }
        }else if(type === "topic") {
            const author = metaTag as SimpleAuthor
            if(!authors.value.find(i => i.id === author.id)) {
                authors.value.splice(authors.value.length, 0, author)
            }
        }else if(type === "author") {
            const topic = metaTag as SimpleTopic
            if(!topics.value.find(i => i.id === topic.id)) {
                topics.value.splice(topics.value.length, 0, topic)
            }
        }
    }

    const removeAt = (type: "tag" | "topic" | "author", index: number) => {
        if(type === "tag") {
            tags.value.splice(index, 1)
        }else if(type === "topic") {
            topics.value.splice(index, 1)
        }else if(type === "author") {
            authors.value.splice(index, 1)
        }
    }

    const validation = useEditorDataValidation(tags)

    return {tags: readonly(tags), topics: readonly(topics), authors: readonly(authors), add, removeAt, validation}
}

function useEditorDataValidation(tags: Ref<SimpleTag[]>) {
    const httpClient = useHttpClient()
    const notification = useNotification()

    const tagValidationResults = ref<MetaTagValidation>()

    watch(tags, async (tags) => {
        tagValidationResults.value = undefined
        if(tags.length) {
            const res = await httpClient.utilMeta.validateTag(tags.map(t => t.id))
            if(res.ok) {
                tagValidationResults.value = res.data
            }else if(res.exception) {
                notification.handleException(res.exception)
            }
        }
    }, {immediate: true, deep: true})

    return {tagValidationResults}
}

function useRightColumnData() {
    const storage = useLocalStorageWithDefault<{
        tab: "db" | "suggest" | "source",
        tabDbType: "author" | "topic" | "tag"
    }>("detail-view/meta-tag-editor/data", {
        tab: "db",
        tabDbType: "author"
    })
    const tab = splitRef(storage, "tab")
    const tabDbType = splitRef(storage, "tabDbType")

    return {tab, tabDbType}
}

export function useMetaDatabaseAuthorData(search: Ref<string>) {
    const httpClient = useHttpClient()
    const { handleError } = useNotification()

    return useContinuousEndpoint<Author>({
        async request(offset: number, limit: number): Promise<{ ok: true; total: number; result: Author[] } | { ok: false; message: string }> {
            const res = await httpClient.author.list({ offset, limit, search: search.value, order: "-updateTime" })
            return res.ok ? { ok: true, ...res.data } : {
                ok: false,
                message: res.exception?.message ?? "unknown error"
            }
        },
        handleError,
        initSize: 40,
        continueSize: 20
    })
}

export function useMetaDatabaseTopicData(search: Ref<string>) {
    const httpClient = useHttpClient()
    const { handleError } = useNotification()

    return useContinuousEndpoint<Topic>({
        async request(offset: number, limit: number): Promise<{ ok: true; total: number; result: Topic[] } | { ok: false; message: string }> {
            const res = await httpClient.topic.list({ offset, limit, search: search.value, order: "-updateTime" })
            return res.ok ? { ok: true, ...res.data } : {
                ok: false,
                message: res.exception?.message ?? "unknown error"
            }
        },
        handleError,
        initSize: 40,
        continueSize: 20
    })
}
