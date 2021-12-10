import { computed, onMounted, reactive, readonly, ref, Ref, watch } from "vue"
import { HttpClient } from "@/functions/adapter-http"
import { ConflictingGroupMembersError, NotFound, ResourceNotExist, ResourceNotSuitable } from "@/functions/adapter-http/exception"
import { Tagme } from "@/functions/adapter-http/impl/illust"
import { DepsTag, SimpleTag } from "@/functions/adapter-http/impl/tag"
import { DepsTopic, SimpleTopic } from "@/functions/adapter-http/impl/topic"
import { DepsAuthor, SimpleAuthor } from "@/functions/adapter-http/impl/author"
import { MetaTagTypeValues } from "@/functions/adapter-http/impl/all"
import { MetaType } from "@/functions/adapter-http/impl/generic"
import { MetaUtilIdentity, MetaUtilValidation } from "@/functions/adapter-http/impl/util-meta"
import { watchGlobalKeyEvent } from "@/functions/feature/keyboard"
import { useToast, ToastManager } from "@/functions/module/toast"
import { useMessageBox } from "@/functions/module/message-box"
import { createPopupMenu } from "@/functions/module/popup-menu"
import { useHttpClient, useLocalStorageWithDefault } from "@/functions/app"
import { useContinuousEndpoint } from "@/functions/utils/endpoints/continuous-endpoint"
import { installation, splitRef } from "@/functions/utils/basic"
import { installSearchService, installTagListContext, useTagListContext, useSearchService } from "@/functions/api/tag-tree"
import { useMetaTagCallout } from "@/layouts/data/MetaTagCallout"
import { installTagTreeContext } from "@/layouts/data/TagTree"
import { sleep } from "@/utils/process"

export { useTagListContext, useSearchService }

interface InstallPanelContext {
    data: Readonly<Ref<EditorData | null>>
    setData: SetData
    close(): void
    identity: Ref<MetaUtilIdentity | null>
}

export interface SetData {
    (form: EditorUpdateForm, errorHandler: (e: EditorUpdateException) => EditorUpdateException | void): Promise<boolean>
}

interface EditorData {
    tags: DepsTag[]
    topics: DepsTopic[]
    authors: DepsAuthor[]
    tagme: Tagme[]
}

interface EditorUpdateForm {
    topics?: number[]
    authors?: number[]
    tags?: number[]
    tagme?: Tagme[]
}

type EditorUpdateException = NotFound | ResourceNotExist<"topics" | "authors" | "tags", number[]> | ResourceNotSuitable<"tags", number[]> | ConflictingGroupMembersError

export const [installPanelContext, usePanelContext] = installation(function(context: InstallPanelContext) {
    const typeFilter = useLocalStorageWithDefault("detail-view/meta-tag-editor/type-filter", {tag: true, author: true, topic: true})

    const editorData = useEditorData(context)

    const rightColumnData = useRightColumnData(context)

    return {identity: context.identity, typeFilter, editorData, rightColumnData}
})

function useEditorData(context: InstallPanelContext) {
    const tags = ref<SimpleTag[]>([])
    const topics = ref<SimpleTopic[]>([])
    const authors = ref<SimpleAuthor[]>([])
    const tagme = ref<Tagme[]>([])
    const changed = reactive({tag: false, topic: false, author: false, tagme: false})

    watch(context.data, d => {
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

    function addAll(records: MetaTagTypeValues[]) {
        const finalRecords: MetaTagTypeValues[] = []
        for(const record of records) {
            if(record.type === "tag") {
                const tag = record.value
                if(!tags.value.find(i => i.id === tag.id)) {
                    tags.value.push(tag)
                    finalRecords.push(record)
                }
                changed.tag = true
            }else if(record.type === "author") {
                const author = record.value
                if(!authors.value.find(i => i.id === author.id)) {
                    authors.value.push(author)
                    finalRecords.push(record)
                }
                changed.author = true
            }else if(record.type === "topic") {
                const topic = record.value
                if(!topics.value.find(i => i.id === topic.id)) {
                    topics.value.push(topic)
                    finalRecords.push(record)
                }
                changed.topic = true
            }
        }
        if(finalRecords.length) {
            addHistoryRecord(finalRecords.map(r => ({...r, action: "add"})))
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

    const { record: addHistoryRecord, recordsHistory, ...history } = useEditorDataHistory(tags, topics, authors, context.data)

    const validation = useEditorDataValidation(tags, topics, authors, context.data)

    const save = useSaveMethod(tags, topics, authors, tagme, changed, validation, recordsHistory, context)

    return {tags: readonly(tags), topics: readonly(topics), authors: readonly(authors), tagme: readonly(tagme), setTagme, add, addAll, removeAt, ...save, validation, history}
}

function useSaveMethod(tags: Ref<SimpleTag[]>,
                       topics: Ref<SimpleTopic[]>,
                       authors: Ref<SimpleAuthor[]>,
                       tagme: Ref<Tagme[]>,
                       changed: {tag: boolean, topic: boolean, author: boolean, tagme: boolean},
                       validation: ReturnType<typeof useEditorDataValidation>,
                       getMetaHistory: () => MetaTagTypeValues[],
                       context: InstallPanelContext) {
    const httpClient = useHttpClient()
    const message = useMessageBox()

    const canSave = computed(() =>
        (changed.tag || changed.topic || changed.author || changed.tagme) &&
        (validation.validationResults.value == undefined ||
            (!validation.validationResults.value.forceConflictingMembers.length && !validation.validationResults.value.notSuitable.length))
    )

    const save = async () => {
        if(canSave.value) {
            //在提交更改之前就记录下变化统计数据，因为在提交更改后，历史记录栈会被清空
            const metaChangedHistory = getMetaHistory()
            const ok = await context.setData({
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
                //发送编辑器历史记录所需的统计数据
                sendEditorHistoryStatistics(metaChangedHistory)
                //保存成功
                context.close()
            }
        }
    }

    const sendEditorHistoryStatistics = (metas: MetaTagTypeValues[]) => {
        //发送一条对象编辑记录
        const identity = context.identity.value
        if(identity !== null) httpClient.metaUtil.history.identities.push(identity).finally()
        //将编辑器撤销栈里的内容发送到标签使用记录
        const metaTags = metas.map(({ type, value }) => ({type: type.toUpperCase() as MetaType, id: value.id}))
        httpClient.metaUtil.history.metaTags.push(metaTags).finally()
    }

    watchGlobalKeyEvent(e => {
        //按下meta + Enter时触发保存
        if(e.metaKey && e.key === "Enter") {
            e.preventDefault()
            e.stopPropagation()
            save().finally()
        }
    })

    return {canSave, save}
}

function useEditorDataValidation(tags: Ref<SimpleTag[]>, topics: Ref<SimpleTopic[]>, authors: Ref<SimpleAuthor[]>, data: Ref<EditorData | null>) {
    const httpClient = useHttpClient()
    const toast = useToast()

    const validationResults = ref<{
        notSuitable: MetaUtilValidation["notSuitable"],
        conflictingMembers: MetaUtilValidation["conflictingMembers"],
        forceConflictingMembers: MetaUtilValidation["forceConflictingMembers"]
    }>()
    const exportedResults = ref<{
        tags: SimpleTag[],
        topics: SimpleTopic[],
        authors: SimpleAuthor[]
    }>({tags: [], topics: [], authors: []})

    const validateFlag = ref({tag: false, topic: false, author: false})
    
    watch(tags, () => validateFlag.value.tag = true, {deep: true})
    watch(topics, () => validateFlag.value.topic = true, {deep: true})
    watch(authors, () => validateFlag.value.author = true, {deep: true})
    
    watch(validateFlag, async (flag, __, onInvalidate) => {
        if(flag.tag || flag.topic || flag.author) {
            let invalidate = false
            onInvalidate(() => invalidate = true)

            await sleep(500)
            if(invalidate) return

            validate(flag).finally()
            validateFlag.value = {tag: false, topic: false, author: false}
        }
    }, {deep: true})

    onMounted(() => {
        if(tags.value.length || topics.value.length || authors.value.length) {
            validate({tag: tags.value.length > 0, topic: topics.value.length > 0, author: authors.value.length > 0}).finally()
        }
    })

    const validate = async (flag: {tag: boolean, topic: boolean, author: boolean}) => {
        const res = await httpClient.metaUtil.validate({
            tags: flag.tag ? tags.value.map(t => t.id) : null, 
            topics: flag.topic ? topics.value.map(t => t.id) : null,
            authors: flag.author ? authors.value.map(t => t.id) : null
        })
        if(res.ok) {
            if(flag.tag) {
                validationResults.value = {
                    notSuitable: res.data.notSuitable,
                    conflictingMembers: res.data.conflictingMembers,
                    forceConflictingMembers: res.data.forceConflictingMembers
                }
                exportedResults.value.tags = res.data.tags.filter(i => i.isExported)
            }
            if(flag.topic) {
                exportedResults.value.topics = res.data.topics.filter(i => i.isExported)
            }
            if(flag.author) {
                exportedResults.value.authors = res.data.authors.filter(i => i.isExported)
            }
        }else{
            if(flag.tag) {
                validationResults.value = undefined
                exportedResults.value.tags = []
            }
            if(flag.topic) {
                exportedResults.value.topics = []
            }
            if(flag.author) {
                exportedResults.value.authors = []
            }
            toast.handleException(res.exception)
        }
    }

    watch(data, () => validationResults.value = undefined)

    return {validationResults, exportedResults}
}

function useEditorDataHistory(tags: Ref<SimpleTag[]>, topics: Ref<SimpleTopic[]>, authors: Ref<SimpleAuthor[]>, data: Ref<EditorData | null>) {
    type Action = {action: "add"} | {action: "remove", index: number}
    type Record = Action & MetaTagTypeValues

    const undoStack = ref<Record[][]>([])
    const redoStack = ref<Record[][]>([])

    const canUndo = computed(() => !!undoStack.value.length)
    const canRedo = computed(() => !!redoStack.value.length)

    const undo = () => {
        if(canUndo.value) {
            const [records] = undoStack.value.splice(undoStack.value.length - 1, 1)
            for(const record of records.reverse()) {
                //对每组records，按反顺序撤销动作
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
            }

            redoStack.value.push(records)
        }
    }

    const redo = () => {
        if(canRedo.value) {
            const [records] = redoStack.value.splice(redoStack.value.length - 1, 1)
            for(const record of records) {
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
            }

            undoStack.value.push(records)
        }
    }

    const record = (record: Record | Record[]) => {
        if(record instanceof Array) {
            undoStack.value.push(record)
        }else{
            undoStack.value.push([record])
        }
        if(redoStack.value.length) {
            redoStack.value = []
        }
    }

    const recordsHistory = () => {
        return undoStack.value.flatMap(i => i).filter(i => i.action === "add").map(i => ({type: i.type, value: i.value} as MetaTagTypeValues))
    }

    watch(data, () => {
        //监听到data变化后就清除历史记录
        undoStack.value = []
        redoStack.value = []
    })

    return {canUndo, canRedo, undo, redo, record, recordsHistory}
}

function useRightColumnData(context: InstallPanelContext) {
    const storage = useLocalStorageWithDefault<{
        tab: "db" | "recent" | "suggest" | "source",
        tabDbType: "author" | "topic" | "tag"
    }>("detail-view/meta-tag-editor/data", {
        tab: "db",
        tabDbType: "author"
    })
    const tab = splitRef(storage, "tab")
    const tabDbType = splitRef(storage, "tabDbType")

    watch(context.identity, identity => {
        if(identity?.type === "IMAGE" && tab.value === "source") {
            tab.value = "suggest"
        }
    })

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
        request: (offset, limit) => httpClient.author.list({ offset, limit, query: search.value, order: "-updateTime" }),
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
        request: (offset, limit) => httpClient.topic.list({ offset, limit, query: search.value, order: "-updateTime" }),
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
