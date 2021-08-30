import { ref, Ref, watch } from "vue"
import { DetailIllust } from "@/functions/adapter-http/impl/illust"
import { SimpleTag } from "@/functions/adapter-http/impl/tag"
import { SimpleTopic } from "@/functions/adapter-http/impl/topic"
import { SimpleAuthor } from "@/functions/adapter-http/impl/author"
import { installation, splitRef } from "@/functions/utils/basic"
import { useLocalStorageWithDefault } from "@/functions/app"
import { useMetadataEndpoint } from "../../inject"

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

    const removeAt = (type: "tag" | "topic" | "author", index: number) => {
        if(type === "tag") {
            tags.value.splice(index, 1)
        }else if(type === "topic") {
            topics.value.splice(index, 1)
        }else if(type === "author") {
            authors.value.splice(index, 1)
        }else{
            throw new Error(`Unsupported type ${type}.`)
        }
    }

    return {tags, topics, authors, removeAt}
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
