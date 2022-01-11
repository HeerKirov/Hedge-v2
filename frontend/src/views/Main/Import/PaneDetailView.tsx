import { computed, defineComponent, PropType, reactive, ref, toRef } from "vue"
import CheckBox from "@/components/forms/CheckBox"
import Select from "@/components/forms/Select"
import ThumbnailImage from "@/components/elements/ThumbnailImage"
import { SourceIdentityEditor, TagmeEditor, DateTimeEditor, ViewAndEditor, DateEditor } from "@/layouts/editors"
import { SourceInfo, TagmeInfo } from "@/layouts/displays"
import { PaneBasicLayout } from "@/layouts/layouts/SplitPane"
import { useMessageBox } from "@/functions/module/message-box"
import { useObjectEndpoint } from "@/functions/utils/endpoints/object-endpoint"
import { DetailImportImage } from "@/functions/adapter-http/impl/import"
import { Tagme } from "@/functions/adapter-http/impl/illust"
import { TimeType } from "@/functions/adapter-http/impl/setting-import"
import { useHttpClient } from "@/functions/app"
import { useToast } from "@/functions/module/toast"
import { objects } from "@/utils/primitives"
import { date, datetime, LocalDate, LocalDateTime } from "@/utils/datetime"
import { useImportContext } from "./inject"
import style from "./style.module.scss"

export default defineComponent({
    setup() {
        const { pane: { state, visible } } = useImportContext()

        const close = () => visible.value = false

        return () => <PaneBasicLayout class={style.paneDetailContent} onClose={close}>
            { state.value.type === "single" ? <SingleView detailId={state.value.value}/>
            : state.value.type === "multiple" ? <MultipleView selected={state.value.values} latest={state.value.latest}/>
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
        detailId: {type: null as any as PropType<number | null>, required: true}
    },
    setup(props) {
        const message = useMessageBox()
        const { list: { dataView } } = useImportContext()

        const { data, setData } = useObjectEndpoint({
            path: toRef(props, "detailId"),
            get: httpClient => httpClient.import.get,
            update: httpClient => httpClient.import.update,
            afterUpdate(id, data: DetailImportImage) {
                const index = dataView.proxy.syncOperations.find(annotation => annotation.id === id)
                if(index != undefined) dataView.proxy.syncOperations.modify(index, data)
            }
        })

        const setTagme = async (tagme: Tagme[]) => {
            return objects.deepEquals(tagme, data.value?.tagme) || await setData({tagme})
        }

        const setSourceInfo = async ({ source, sourceId, sourcePart }: { source: string | null, sourceId: number | null, sourcePart: number | null}) => {
            return (source === data.value?.source && sourceId === data.value?.sourceId && sourcePart === data.value?.sourcePart) || await setData({source, sourceId, sourcePart}, e => {
                if(e.code === "NOT_EXIST") {
                    message.showOkMessage("error", `来源${source}不存在。`)
                }else if(e.code === "PARAM_ERROR") {
                    const target = e.info === "sourceId" ? "来源ID" : e.info === "sourcePart" ? "分P" : e.info
                    message.showOkMessage("error", `${target}的值内容错误。`, "ID只能是自然数。")
                }else if(e.code === "PARAM_REQUIRED") {
                    const target = e.info === "sourceId" ? "来源ID" : e.info === "sourcePart" ? "分P" : e.info
                    message.showOkMessage("error", `${target}属性缺失。`)
                }else if(e.code === "PARAM_NOT_REQUIRED") {
                    if(e.info === "sourcePart") {
                        message.showOkMessage("error", `分P属性不需要填写，因为选择的来源类型不支持分P。`)
                    }else if(e.info === "sourceId/sourcePart") {
                        message.showOkMessage("error", `来源ID/分P属性不需要填写，因为未指定来源类型。`)
                    }else{
                        message.showOkMessage("error", `${e.info}属性不需要填写。`)
                    }
                }else{
                    return e
                }
            })
        }

        const setPartitionTime = async (partitionTime: LocalDateTime) => {
            return partitionTime.timestamp === data.value?.partitionTime?.timestamp || await setData({partitionTime})
        }

        const setCreateTime = async (createTime: LocalDateTime) => {
            return createTime.timestamp === data.value?.createTime?.timestamp || await setData({createTime})
        }

        const setOrderTime = async (orderTime: LocalDateTime) => {
            return orderTime.timestamp === data.value?.orderTime?.timestamp || await setData({orderTime})
        }

        return () => data.value && <>
            <p class={style.top}/>
            <ThumbnailImage value={data.value.thumbnailFile} minHeight="12rem" maxHeight="40rem"/>
            {data.value.fileName && <p class={[style.filename, "can-be-selected"]}><b>{data.value.fileName}</b></p>}
            {data.value.fileCreateTime && <p class="has-text-grey">文件创建时间 {datetime.toSimpleFormat(data.value.fileCreateTime)}</p>}
            {data.value.fileUpdateTime && <p class="has-text-grey">文件修改时间 {datetime.toSimpleFormat(data.value.fileUpdateTime)}</p>}
            {data.value.fileImportTime && <p class="has-text-grey">文件导入时间 {datetime.toSimpleFormat(data.value.fileImportTime)}</p>}
            <div class={style.separator}/>
            <ViewAndEditor data={{source: data.value.source, sourceId: data.value.sourceId, sourcePart: data.value.sourcePart}} onSetData={setSourceInfo} v-slots={{
                default: ({ value }: {value: {source: string | null, sourceId: number | null, sourcePart: number | null}}) => <SourceInfo {...value}/>,
                editor: ({ value, setValue }) => <SourceIdentityEditor {...value} onUpdateValue={setValue}/>
            }}/>
            <div class={style.spacing}/>
            <ViewAndEditor data={data.value.tagme} onSetData={setTagme} v-slots={{
                default: ({ value }) => <TagmeInfo value={value}/>,
                editor: ({ value, setValue }) => <TagmeEditor value={value} onUpdateValue={setValue}/>
            }}/>
            <div class={style.spacing}/>
            <ViewAndEditor data={data.value.partitionTime} onSetData={setPartitionTime} v-slots={{
                default: ({ value }) => <p class="has-text-grey">时间分区 {date.toISOString(value)}</p>,
                editor: ({ value, setValue }) => <DateEditor value={value} onUpdateValue={setValue}/>
            }}/>
            <ViewAndEditor data={data.value.createTime} onSetData={setCreateTime} v-slots={{
                default: ({ value }) => <p class="has-text-grey">创建时间 {datetime.toSimpleFormat(value)}</p>,
                editor: ({ value, setValue }) => <DateTimeEditor value={value} onUpdateValue={setValue}/>
            }}/>
            <ViewAndEditor data={data.value.orderTime} onSetData={setOrderTime} v-slots={{
                default: ({ value }) => <p class="has-text-grey">排序时间 {datetime.toSimpleFormat(value)}</p>,
                editor: ({ value, setValue }) => <DateTimeEditor value={value} onUpdateValue={setValue}/>
            }}/>
        </>
    }
})

const MultipleView = defineComponent({
    props: {
        selected: {type: Array as PropType<number[]>, required: true},
        latest: {type: Number, required: true}
    },
    setup(props) {
        const { data } = useObjectEndpoint({
            path: toRef(props, "latest"),
            get: httpClient => httpClient.import.get
        })

        const batchUpdateMode = ref(false)

        return () => <>
            <p class="mt-2 mb-1"><i>已选择{props.selected.length}项</i></p>
            <ThumbnailImage value={data.value?.thumbnailFile} minHeight="12rem" maxHeight="40rem"/>
            {data.value?.fileName && <p class={[style.filename, "can-be-selected"]}><b>{data.value.fileName}</b></p>}
            {batchUpdateMode.value
                ? <BatchUpdate selected={props.selected} onClose={() => batchUpdateMode.value = false}/>
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
    emits: ["close"],
    setup(props, { emit }) {
        const toast = useToast()
        const httpClient = useHttpClient()
        const { list: { endpoint } } = useImportContext()

        const enabled = reactive({
            tagme: false,
            setCreatedTimeBy: false,
            setOrderTimeBy: false,
            partitionTime: false
        })
        const form = reactive<{
            tagme: Tagme[]
            setCreatedTimeBy: TimeType
            setOrderTimeBy: TimeType
            partitionTime: LocalDate
            analyseSource: boolean
        }>({
            tagme: [],
            setCreatedTimeBy: "UPDATE_TIME",
            setOrderTimeBy: "UPDATE_TIME",
            partitionTime: date.now(),
            analyseSource: false
        })

        const anyEnabled = computed(() => enabled.tagme || enabled.setCreatedTimeBy || enabled.setOrderTimeBy || enabled.partitionTime || form.analyseSource)

        const submit = async () => {
            if(anyEnabled.value) {
                const res = await httpClient.import.batchUpdate({
                    target: props.selected ?? undefined,
                    tagme: enabled.tagme ? form.tagme : undefined,
                    setCreateTimeBy: enabled.setCreatedTimeBy ? form.setCreatedTimeBy : undefined,
                    setOrderTimeBy: enabled.setOrderTimeBy ? form.setOrderTimeBy : undefined,
                    partitionTime: enabled.partitionTime ? form.partitionTime : undefined,
                    analyseSource: form.analyseSource
                })
                if(res.ok) {
                    if(res.data.length > 0) {
                        if(res.data.length > 3) {
                            toast.toast("来源信息分析失败", "warning", `超过${res.data.length}个文件的来源信息分析失败，可能是因为正则表达式内容错误。`)
                        }else{
                            toast.toast("来源信息分析失败", "warning", "存在文件的来源信息分析失败，可能是因为正则表达式内容错误。")
                        }
                    }else{
                        toast.toast("批量编辑完成", "info", "已完成所选项目的信息批量编辑。")
                    }
                    emit("close")
                    endpoint.refresh()
                }else{
                    toast.handleException(res.exception)
                }
            }
        }

        return () => <>
            <p class="mt-4"><span class="icon"><i class="fa fa-edit"/></span><span>批量编辑</span></p>
            <p class="mt-2"><CheckBox value={enabled.tagme} onUpdateValue={v => enabled.tagme = v}>设置Tagme</CheckBox></p>
            {enabled.tagme && <TagmeEditor class="mt-1 mb-2" value={form.tagme} onUpdateValue={v => form.tagme = v}/>}
            <p class="mt-1"><CheckBox value={enabled.setCreatedTimeBy} onUpdateValue={v => enabled.setCreatedTimeBy = v}>设置创建时间</CheckBox></p>
            {enabled.setCreatedTimeBy && <Select class="mt-1 mb-2" items={timeTypes} value={form.setCreatedTimeBy} onUpdateValue={(v: TimeType) => form.setCreatedTimeBy = v}/>}
            <p class="mt-1"><CheckBox value={enabled.setOrderTimeBy} onUpdateValue={v => enabled.setOrderTimeBy = v}>设置排序时间</CheckBox></p>
            {enabled.setOrderTimeBy && <Select class="mt-1 mb-2" items={timeTypes} value={form.setOrderTimeBy} onUpdateValue={(v: TimeType) => form.setOrderTimeBy = v}/>}
            <p class="mt-1"><CheckBox value={enabled.partitionTime} onUpdateValue={v => enabled.partitionTime = v}>设置时间分区</CheckBox></p>
            {enabled.partitionTime && <DateEditor class="mt-1 mb-2" value={form.partitionTime} onUpdateValue={v => form.partitionTime = v}/>}
            <p class="mt-1"><CheckBox value={form.analyseSource} onUpdateValue={v => form.analyseSource = v}>分析来源数据</CheckBox></p>
            <button class="button is-info w-100 mt-6" disabled={!anyEnabled.value} onClick={submit}>
                <span class="icon"><i class="fa fa-check"/></span><span>提交批量更改</span>
            </button>
            <button class="button is-white w-100 mt-1" onClick={() => emit("close")}>
                <span class="icon"><i class="fa fa-times"/></span><span>取消</span>
            </button>
        </>
    }
})

const timeTypes: {value: TimeType, name: string}[] = [
    {value: "IMPORT_TIME", name: "按 项目导入时间 设定"},
    {value: "CREATE_TIME", name: "按 文件创建时间 设定"},
    {value: "UPDATE_TIME", name: "按 文件修改时间 设定"}
]
