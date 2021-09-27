import { computed, reactive, readonly, ref, Ref, watch } from "vue"
import { HttpClient } from "@/functions/adapter-http"
import { DetailIllust, Tagme } from "@/functions/adapter-http/impl/illust"
import { SimpleTag } from "@/functions/adapter-http/impl/tag"
import { SimpleTopic } from "@/functions/adapter-http/impl/topic"
import { SimpleAuthor } from "@/functions/adapter-http/impl/author"
import { MetaTagTypeValues } from "@/functions/adapter-http/impl/all"
import { MetaTagValidation } from "@/functions/adapter-http/impl/util-meta"
import { watchGlobalKeyEvent } from "@/functions/feature/keyboard"
import { useToast, ToastManager } from "@/functions/module/toast"
import { useMessageBox } from "@/functions/module/message-box"
import { createPopupMenu } from "@/functions/module/popup-menu"
import { useHttpClient, useLocalStorageWithDefault } from "@/functions/app"
import { useContinuousEndpoint } from "@/functions/utils/endpoints/continuous-endpoint"
import { installation, splitRef } from "@/functions/utils/basic"
import { useMetaTagCallout } from "@/layouts/data/MetaTagCallout"
import { installSearchService, installTagListContext, useTagListContext, useSearchService } from "@/functions/api/tag-tree"
import { installTagTreeContext } from "@/layouts/data/TagTree"
import { sleep } from "@/utils/process"
import { useDetailViewContext, useMetadataEndpoint } from "../../inject"

export { useTagListContext, useSearchService }

export const [installPanelContext, usePanelContext] = installation(function() {
    const { data } = useMetadataEndpoint()

    const typeFilter = useLocalStorageWithDefault("detail-view/meta-tag-editor/type-filter", {tag: true, author: true, topic: true})

    const editorData = useEditorData(data)

    const rightColumnData = useRightColumnData()

    return {typeFilter, editorData, rightColumnData}
})

function useEditorData(data: Ref<DetailIllust | null>) {
    const tags = ref<SimpleTag[]>([])
    const topics = ref<SimpleTopic[]>([])
    const authors = ref<SimpleAuthor[]>([])
    const tagme = ref<Tagme[]>([])
    const changed = reactive({tag: false, topic: false, author: false, tagme: false})

    watch(data, d => {
        tags.value = d?.tags?.filter(t => !t.isExported) ?? []
        topics.value = d?.topics?.filter(t => !t.isExported) ?? []
        authors.value = d?.authors?.filter(t => !t.isExported) ?? []
        tagme.value = d?.tagme ?? []
        changed.tag = false
        changed.topic = false
        changed.author = false
        changed.tagme = false
    }, {immediate: true})

    interface MetaTagReflection {
        tag: SimpleTag
        topic: SimpleTopic
        author: SimpleAuthor
    }

    const setTagme = (value: Tagme[]) => {
        tagme.value = value
        changed.tagme = true
    }

    function add<T extends keyof MetaTagReflection>(type: T, metaTag: MetaTagReflection[T]) {
        if(type === "tag") {
            const tag = metaTag as SimpleTag
            if(!tags.value.find(i => i.id === tag.id)) {
                tags.value.push(tag)
                addHistoryRecord({type: "tag", value: tag, action: "add"})
            }
            changed.tag = true
        }else if(type === "author") {
            const author = metaTag as SimpleAuthor
            if(!authors.value.find(i => i.id === author.id)) {
                authors.value.push(author)
                addHistoryRecord({type: "author", value: author, action: "add"})
            }
            changed.author = true
        }else if(type === "topic") {
            const topic = metaTag as SimpleTopic
            if(!topics.value.find(i => i.id === topic.id)) {
                topics.value.push(topic)
                addHistoryRecord({type: "topic", value: topic, action: "add"})
            }
            changed.topic = true
        }
    }

    const removeAt = (type: "tag" | "topic" | "author", index: number) => {
        if(type === "tag") {
            const [tag] = tags.value.splice(index, 1)
            addHistoryRecord({type: "tag", value: tag, action: "remove", index})
            changed.tag = true
        }else if(type === "topic") {
            const [topic] = topics.value.splice(index, 1)
            addHistoryRecord({type: "topic", value: topic, action: "remove", index})
            changed.topic = true
        }else if(type === "author") {
            const [author] = authors.value.splice(index, 1)
            addHistoryRecord({type: "author", value: author, action: "remove", index})
            changed.author = true
        }
    }

    const validation = useEditorDataValidation(tags, data)

    const { record: addHistoryRecord, ...history } = useEditorDataHistory(tags, topics, authors, data)

    const { canSave, save } = useSaveFunction(tags, topics, authors, tagme, changed, validation)

    return {tags: readonly(tags), topics: readonly(topics), authors: readonly(authors), tagme: readonly(tagme), setTagme, add, removeAt, canSave, save, validation, history}
}

function useSaveFunction(tags: Ref<SimpleTag[]>, topics: Ref<SimpleTopic[]>, authors: Ref<SimpleAuthor[]>, tagme: Ref<Tagme[]>, changed: {tag: boolean, topic: boolean, author: boolean, tagme: boolean}, validation: ReturnType<typeof useEditorDataValidation>) {
    const message = useMessageBox()
    const { setData } = useMetadataEndpoint()
    const { ui: { drawerTab } } = useDetailViewContext()

    const canSave = computed(() =>
        (changed.tag || changed.topic || changed.author || changed.tagme) &&
        (validation.tagValidationResults.value == undefined ||
            (!validation.tagValidationResults.value.forceConflictingMembers.length && !validation.tagValidationResults.value.notSuitable.length))
    )

    const save = async () => {
        if(canSave.value) {
            const ok = await setData({
                tags: changed.tag ? tags.value.map(i => i.id) : undefined,
                topics: changed.topic ? topics.value.map(i => i.id) : undefined,
                authors: changed.author ? authors.value.map(i => i.id) : undefined,
                tagme: changed.tagme ? tagme.value : undefined
            }, e => {
                if(e.code === "NOT_EXIST") {
                    const [type, list] = e.info
                    const typeName = type === "tags" ? "标签" : type === "topics" ? "主题" : "作者"
                    message.showOkMessage("error", `选择的部分${typeName}不存在。`, `错误项: ${list}`)
                }else if(e.code === "NOT_SUITABLE") {
                    message.showOkMessage("prompt", "选择的部分标签不适用。", "请参阅下方的约束提示修改内容。")
                }else if(e.code === "CONFLICTING_GROUP_MEMBERS") {
                    message.showOkMessage("prompt", "选择的部分标签存在强制组冲突。", "请参阅下方的约束提示修改内容。")
                }else{
                    return e
                }
            })

            if(ok) {
                //保存成功后关闭面板
                drawerTab.value = undefined
            }
        }
    }

    watchGlobalKeyEvent(e => {
        if(e.metaKey && e.key === "Enter") {
            e.preventDefault()
            e.stopPropagation()
            save().finally()
        }
    })

    return {canSave, save}
}

function useEditorDataValidation(tags: Ref<SimpleTag[]>, data: Ref<DetailIllust | null>) {
    const httpClient = useHttpClient()
    const toast = useToast()

    const tagValidationResults = ref<MetaTagValidation>()

    //TODO 为校验功能添加Link和Exported项的标记提示，告诉用户这些项是哪儿来的，以免摸不着头脑
    watch(tags, async (tags, _, onInvalidate) => {
        if(tags.length) {
            let invalidate = false
            onInvalidate(() => invalidate = true)

            await sleep(1000)
            if(invalidate) return

            const res = await httpClient.metaUtil.validateTag(tags.map(t => t.id))
            if(invalidate) return

            if(res.ok) {
                tagValidationResults.value = res.data
            }else if(res.exception) {
                tagValidationResults.value = undefined
                toast.handleException(res.exception)
            }
        }else{
            tagValidationResults.value = undefined
        }
    }, {immediate: true, deep: true})

    watch(data, () => tagValidationResults.value = undefined)

    return {tagValidationResults}
}

function useEditorDataHistory(tags: Ref<SimpleTag[]>, topics: Ref<SimpleTopic[]>, authors: Ref<SimpleAuthor[]>, data: Ref<DetailIllust | null>) {
    type Action = {action: "add"} | {action: "remove", index: number}
    type Record = Action & MetaTagTypeValues

    const undoStack = ref<Record[]>([])
    const redoStack = ref<Record[]>([])

    const canUndo = computed(() => !!undoStack.value.length)
    const canRedo = computed(() => !!redoStack.value.length)

    const undo = () => {
        if(canUndo.value) {
            const [record] = undoStack.value.splice(undoStack.value.length - 1, 1)
            if(record.type === "tag") {
                //撤销时执行相反的操作
                if(record.action === "add") {
                    const i = tags.value.findIndex(i => i.id === record.value.id)
                    tags.value.splice(i, 1)
                }else{
                    if(!tags.value.find(i => i.id === record.value.id)) {
                        tags.value.splice(record.index, 0, record.value)
                    }
                }
            }else if(record.type === "topic") {
                if(record.action === "add") {
                    const i = topics.value.findIndex(i => i.id === record.value.id)
                    topics.value.splice(i, 1)
                }else{
                    if(!topics.value.find(i => i.id === record.value.id)) {
                        topics.value.splice(record.index, 0, record.value)
                    }
                }
            }else if(record.type === "author") {
                if(record.action === "add") {
                    const i = authors.value.findIndex(i => i.id === record.value.id)
                    authors.value.splice(i, 1)
                }else{
                    if(!authors.value.find(i => i.id === record.value.id)) {
                        authors.value.splice(record.index, 0, record.value)
                    }
                }
            }

            redoStack.value.push(record)
        }
    }

    const redo = () => {
        if(canRedo.value) {
            const [record] = redoStack.value.splice(redoStack.value.length - 1, 1)
            if(record.type === "tag") {
                //重做时执行相同的操作
                if(record.action === "add") {
                    if(!tags.value.find(i => i.id === record.value.id)) {
                        tags.value.push(record.value)
                    }
                }else{
                    const i = tags.value.findIndex(i => i.id === record.value.id)
                    tags.value.splice(i, 1)
                }
            }else if(record.type === "topic") {
                //重做时执行相同的操作
                if(record.action === "add") {
                    if(!topics.value.find(i => i.id === record.value.id)) {
                        topics.value.push(record.value)
                    }
                }else{
                    const i = topics.value.findIndex(i => i.id === record.value.id)
                    topics.value.splice(i, 1)
                }
            }else if(record.type === "author") {
                //重做时执行相同的操作
                if(record.action === "add") {
                    if(!authors.value.find(i => i.id === record.value.id)) {
                        authors.value.push(record.value)
                    }
                }else{
                    const i = authors.value.findIndex(i => i.id === record.value.id)
                    authors.value.splice(i, 1)
                }
            }

            undoStack.value.push(record)
        }
    }

    const record = (record: Record) => {
        undoStack.value.push(record)
        if(redoStack.value.length) {
            redoStack.value = []
        }
    }

    watch(data, () => {
        undoStack.value = []
        redoStack.value = []
    })

    return {canUndo, canRedo, undo, redo, record}
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

const [installMetaDatabaseContext, useMetaDatabaseContext] = installation(function() {
    const httpClient = useHttpClient()
    const toast = useToast()

    const author = useMetaDatabaseAuthorContext(httpClient, toast)
    const topic = useMetaDatabaseTopicContext(httpClient, toast)
    useMetaDatabaseTagContext()

    return {author, topic}
})

function useMetaDatabaseAuthorContext(httpClient: HttpClient, { handleError }: ToastManager) {
    const search = ref<string>()

    const data = useContinuousEndpoint({
        request: (offset, limit) => httpClient.author.list({ offset, limit, search: search.value, order: "-updateTime" }),
        handleError,
        initSize: 40,
        continueSize: 20
    })

    watch(search, () => data.refresh())

    return {search, data}
}

function useMetaDatabaseTopicContext(httpClient: HttpClient, { handleError }: ToastManager) {
    const search = ref<string>()

    const data = useContinuousEndpoint({
        request: (offset, limit) => httpClient.topic.list({ offset, limit, search: search.value, order: "-updateTime" }),
        handleError,
        initSize: 40,
        continueSize: 20
    })

    watch(search, () => data.refresh())

    return {search, data}
}

function useMetaDatabaseTagContext() {
    const tagListContext = installTagListContext()
    const metaTagCallout = useMetaTagCallout()
    installTagTreeContext({
        tagListContext,
        draggable(tag) {
            return tag.type === "TAG"
        },
        click(tag, _, e) {
            metaTagCallout.open((e.currentTarget as Element).getBoundingClientRect(), "tag", tag.id)
        },
        rightClick(tag, context) {
            createPopupMenu([
                {type: "normal", label: "折叠全部标签", click: context.collapseItem},
                {type: "normal", label: "展开全部标签", click: context.expandItem},
            ])()
        },
        isCursorPointer: false
    })
    installSearchService(tagListContext)
}

export { installMetaDatabaseContext }

export function useMetaDatabaseAuthorData() {
    const { author } = useMetaDatabaseContext()
    return author
}

export function useMetaDatabaseTopicData() {
    const { topic } = useMetaDatabaseContext()
    return topic
}
