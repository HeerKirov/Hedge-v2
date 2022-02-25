import { computed, defineComponent, PropType, reactive, ref, toRef, watch } from "vue"
import CheckBox from "@/components/forms/CheckBox"
import Textarea from "@/components/forms/Textarea"
import ThumbnailImage from "@/components/elements/ThumbnailImage"
import { useEditMetaTagService } from "@/layouts/globals/GlobalDialog"
import { PaneBasicLayout } from "@/components/layouts/SplitPane"
import { DescriptionDisplay, MetaTagListDisplay, PartitionTimeDisplay, ScoreDisplay, TagmeInfo, TimeDisplay } from "@/layouts/displays"
import { DateEditor, DateTimeEditor, DescriptionEditor, StarlightEditor, TagmeEditor, ViewAndEditable, ViewAndEditor } from "@/layouts/editors"
import { SimpleTag, SimpleTopic, SimpleAuthor } from "@/functions/adapter-http/impl/all"
import { DetailIllust, Tagme } from "@/functions/adapter-http/impl/illust"
import { useObjectEndpoint } from "@/functions/endpoints/object-endpoint"
import { useHttpClient } from "@/services/app"
import { useToast } from "@/services/module/toast"
import { date, datetime, LocalDate, LocalDateTime } from "@/utils/datetime"
import { StateOfSidePaneState } from "./features"
import style from "./style.module.scss"

export default defineComponent({
    props: {
        state: Object as PropType<StateOfSidePaneState>
    },
    emits: {
        close: () => true,
        afterUpdate: (_: number, __: DetailIllust) => true,
        refreshEndpoint: () => true
    },
    setup(props, { emit }) {
        return () => <PaneBasicLayout class={style.paneDetailContent} onClose={() => emit("close")}>
            { props.state?.type === "single" ? <SingleView detailId={props.state.value} onAfterUpdate={(id, data) => emit("afterUpdate", id, data)}/>
            : props.state?.type === "multiple" ? <MultipleView selected={props.state.values} latest={props.state.latest} onRefreshEndpoint={() => emit("refreshEndpoint")}/>
            : <EmptyView/>}
        </PaneBasicLayout>
    }
})

const EmptyView = defineComponent({
    setup() {
        return () => <>
            <p class={style.top}/>
            <ThumbnailImage value={null} minHeight="12rem" maxHeight="40rem"/>
            <p class="mt-1"><b>导入项目</b></p>
            <p class="mt-1"><i class="has-text-grey">未选择任何项</i></p>
        </>
    }
})

const SingleView = defineComponent({
    props: {
        detailId: { type: null as any as PropType<number | null>, required: true }
    },
    emits: {
        afterUpdate: (_: number, __: DetailIllust) => true,
    },
    setup(props, { emit }) {
        const editMetaTagService = useEditMetaTagService()

        const path = toRef(props, "detailId")

        const { data, setData, refreshData } = useObjectEndpoint({
            path,
            get: httpClient => httpClient.illust.get,
            update: httpClient => httpClient.illust.update,
            afterUpdate: (id, data: DetailIllust) => emit("afterUpdate", id, data)
        })

        const setDescription = async (description: string) => {
            return description === data.value?.description || await setData({ description })
        }
        const setScore = async (score: number | null) => {
            return score === data.value?.score || await setData({ score })
        }
        const setPartitionTime = async (partitionTime: LocalDateTime) => {
            return partitionTime.timestamp === data.value?.partitionTime?.timestamp || await setData({partitionTime})
        }
        const setOrderTime = async (orderTime: LocalDateTime) => {
            return orderTime.timestamp === data.value?.orderTime?.timestamp || await setData({orderTime})
        }
        const openMetaTagEditor = () => {
            if(data.value !== null) {
                editMetaTagService.editIdentity({type: data.value.type, id: data.value.id}, refreshData)
            }
        }

        return () => <>
            <p class={style.top}/>
            <ThumbnailImage value={data.value?.thumbnailFile} minHeight="12rem" maxHeight="40rem"/>
            <p>
                <i class="fa fa-id-card mr-2"/><b class="can-be-selected">{path.value}</b>
                {(data.value?.childrenCount || null) && <span class="float-right">{data.value?.childrenCount}个子项</span>}
            </p>
            {data.value && <>
                <ViewAndEditor class="mt-3" data={data.value.description} useEditorData editorData={data.value.originDescription} onSetData={setDescription} showSaveButton={false} v-slots={{
                    default: ({ value }) => <DescriptionDisplay value={value}/>,
                    editor: ({ value, setValue, save }) => <DescriptionEditor value={value} onUpdateValue={setValue} onSave={save} showSaveButton={true}/>
                }}/>
                <ViewAndEditor class="mt-3" data={data.value.score} useEditorData editorData={data.value.originScore} onSetData={setScore} baseline="medium" v-slots={{
                    default: ({ value }) => <ScoreDisplay class="pt-1" value={value}/>,
                    editor: ({ value, setValue }) => <StarlightEditor value={value} onUpdateValue={setValue}/>
                }}/>
                <ViewAndEditable class="mt-4" onEdit={openMetaTagEditor}>
                    {data.value.tagme.length > 0 && <TagmeInfo class="is-white" value={data.value.tagme}/>}
                    <MetaTagListDisplay authors={data.value.authors} topics={data.value.topics} tags={data.value.tags}/>
                </ViewAndEditable>
                {data.value.type === "IMAGE" ? <ViewAndEditor class="mt-2" data={data.value.partitionTime} onSetData={setPartitionTime} baseline="medium" v-slots={{
                    default: ({ value }) => <PartitionTimeDisplay partitionTime={value}/>,
                    editor: ({ value, setValue }) => <DateEditor value={value} onUpdateValue={setValue}/>
                }}/> : <div class="mt-2">
                    <PartitionTimeDisplay partitionTime={data.value.partitionTime}/>
                </div>}
                {data.value.type === "IMAGE" ? <ViewAndEditor class="mt-1" data={[data.value.orderTime, data.value.createTime, data.value.updateTime]} useEditorData editorData={data.value.orderTime} onSetData={setOrderTime} baseline="medium" v-slots={{
                    default: ({ value: [orderTime, createTime, updateTime] }) => <TimeDisplay orderTime={orderTime} createTime={createTime} updateTime={updateTime}/>,
                    editor: ({ value, setValue }) => <DateTimeEditor value={value} onUpdateValue={setValue}/>
                }}/> : <div class="mt-1">
                    <TimeDisplay orderTime={data.value.orderTime} createTime={data.value.createTime} updateTime={data.value.updateTime}/>
                </div>}
            </>}
        </>
    }
})

const MultipleView = defineComponent({
    props: {
        selected: { type: Array as PropType<number[]>, required: true },
        latest: { type: Number, required: true }
    },
    emits: ["refreshEndpoint"],
    setup(props, { emit }) {
        const path = toRef(props, "latest")

        const { data } = useObjectEndpoint({
            path,
            get: httpClient => httpClient.illust.get
        })

        const batchUpdateMode = ref(false)

        return () => <>
            <p class="mt-2 mb-1"><i>已选择{props.selected.length}项</i></p>
            <ThumbnailImage value={data.value?.thumbnailFile} minHeight="12rem" maxHeight="40rem"/>
            <p>
                <i class="fa fa-id-card mr-2"/><b class="can-be-selected">{path.value}</b>
                {(data.value?.childrenCount || null) && <span class="float-right">{data.value?.childrenCount}个子项</span>}
            </p>
            {batchUpdateMode.value
                ? <BatchUpdate class="mt-4" selected={props.selected} onClose={() => batchUpdateMode.value = false} onRefreshEndpoint={() => emit("refreshEndpoint")}/>
                : <p class="mt-4">
                    <a onClick={() => batchUpdateMode.value = true}>
                        <span class="icon"><i class="fa fa-edit"/></span><span>批量编辑</span>
                    </a>
                </p>
            }
        </>
    }
})

const BatchUpdate = defineComponent({
    props: {
        selected: {type: Array as PropType<number[]>, required: true}
    },
    emits: ["close", "refreshEndpoint"],
    setup(props, { emit }) {
        const toast = useToast()
        const httpClient = useHttpClient()
        const editMetaTagService = useEditMetaTagService()

        const enabled = reactive({
            description: false,
            score: false,
            metaTag: false,
            tagme: false,
            partitionTime: false,
            orderTime: false
        })
        const form = reactive<{
            description: string
            score: number | null
            tags: SimpleTag[]
            topics: SimpleTopic[]
            authors: SimpleAuthor[]
            tagme: Tagme[]
            partitionTime: LocalDate,
            orderTime: {
                begin: LocalDateTime,
                end: LocalDateTime
            }
        }>({
            description: "",
            score: null,
            tags: [],
            topics: [],
            authors: [],
            tagme: ["TAG", "TOPIC", "AUTHOR"],
            partitionTime: date.now(),
            orderTime: {
                begin: datetime.now(),
                end: datetime.now()
            }
        })

        const editMetaTag = async () => {
            const res = await editMetaTagService.edit({
                topics: form.topics.map(i => ({ ...i, isExported: false })),
                authors: form.authors.map(i => ({ ...i, isExported: false })),
                tags: form.tags.map(i => ({ ...i, isExported: false }))
            }, {
                allowEditTagme: false
            })
            if(res) {
                form.topics = res.topics
                form.authors = res.authors
                form.tags = res.tags
            }
        }

        watch(() => enabled.metaTag, enabled => {
            if(enabled) editMetaTag().finally()
        })

        const anyEnabled = computed(() => enabled.description || enabled.score || enabled.metaTag || enabled.tagme || enabled.partitionTime || enabled.orderTime)

        const submit = async () => {
            if(anyEnabled.value) {
                const res = await httpClient.illust.batchUpdate({
                    target: props.selected,
                    tagme: enabled.tagme ? form.tagme : undefined,
                    tags: enabled.metaTag && form.tags.length ? form.tags.map(i => i.id) : undefined,
                    topics: enabled.metaTag && form.topics.length ? form.topics.map(i => i.id) : undefined,
                    authors: enabled.metaTag && form.authors.length ? form.authors.map(i => i.id) : undefined,
                    description: enabled.description ? form.description : undefined,
                    score: enabled.score ? form.score : undefined,
                    partitionTime: enabled.partitionTime ? form.partitionTime : undefined,
                    orderTimeBegin: enabled.orderTime ? form.orderTime.begin : undefined,
                    orderTimeEnd: enabled.orderTime ? form.orderTime.end : undefined
                })
                if(res.ok) {
                    emit("close")
                    emit("refreshEndpoint")
                }else{
                    toast.handleException(res.exception)
                }
            }
        }

        return () => <div>
            <p><span class="icon"><i class="fa fa-edit"/></span><span>批量编辑</span></p>
            <p class="mt-2"><CheckBox value={enabled.metaTag} onUpdateValue={v => enabled.metaTag = v}>设置元数据标签</CheckBox></p>
            {enabled.metaTag && <>
                <button class="button mt-1" onClick={editMetaTag}><span class="icon"><i class="fa fa-feather-alt"/></span><span>编辑元数据标签</span></button>
                <p>已设置{form.tags.length}个标签、{form.topics.length}个主题、{form.authors.length}个作者</p>
                <p class="mb-1"><i class="has-text-grey">批量设定的元数据标签将覆盖所选项所有已存在的标签。</i></p>
            </>}
            <p class="mt-1"><CheckBox value={enabled.tagme} onUpdateValue={v => enabled.tagme = v}>设置Tagme</CheckBox></p>
            {enabled.tagme && <TagmeEditor class="mt-1 mb-2" value={form.tagme} onUpdateValue={v => form.tagme = v}/>}
            <p class="mt-1"><CheckBox value={enabled.description} onUpdateValue={v => enabled.description = v}>设置描述</CheckBox></p>
            {enabled.description && <Textarea placeholder="描述" value={form.description} onUpdateValue={v => form.description = v} focusOnMounted={true}/>}
            <p class="mt-1"><CheckBox value={enabled.score} onUpdateValue={v => enabled.score = v}>设置评分</CheckBox></p>
            {enabled.score && <StarlightEditor value={form.score} onUpdateValue={v => form.score = v}/>}
            <p class="mt-1"><CheckBox value={enabled.partitionTime} onUpdateValue={v => enabled.partitionTime = v}>设置时间分区</CheckBox></p>
            {enabled.partitionTime && <DateEditor class="mt-1 mb-2" value={form.partitionTime} onUpdateValue={v => form.partitionTime = v}/>}
            <p class="mt-1"><CheckBox value={enabled.orderTime} onUpdateValue={v => enabled.orderTime = v}>设置排序时间</CheckBox></p>
            {enabled.orderTime && <>
                <label class="label mt-1">起始时间点</label>
                <DateTimeEditor class="mt-1" value={form.orderTime.begin} onUpdateValue={v => form.orderTime.begin = v}/>
                <label class="label mt-1">末尾时间点</label>
                <DateTimeEditor class="mt-1" value={form.orderTime.end} onUpdateValue={v => form.orderTime.end = v}/>
                <p class="mb-1"><i class="has-text-grey">批量设定的排序时间将均匀分布在设定的时间范围内。</i></p>
            </>}
            <button class="button is-info w-100 mt-6" disabled={!anyEnabled.value} onClick={submit}>
                <span class="icon"><i class="fa fa-check"/></span><span>提交批量更改</span>
            </button>
            <button class="button is-white w-100 mt-1" onClick={() => emit("close")}>
                <span class="icon"><i class="fa fa-times"/></span><span>取消</span>
            </button>
        </div>
    }
})
