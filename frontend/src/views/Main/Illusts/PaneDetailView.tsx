import { defineComponent, PropType, toRef } from "vue"
import ThumbnailImage from "@/components/elements/ThumbnailImage"
import { useEditMetaTagService } from "@/layouts/dialogs"
import { PaneBasicLayout } from "@/layouts/layouts/SplitPane"
import { DescriptionDisplay, MetaTagListDisplay, PartitionTimeDisplay, ScoreDisplay, TagmeInfo, TimeDisplay } from "@/layouts/displays"
import { DateEditor, DateTimeEditor, DescriptionEditor, StarlightEditor, ViewAndEditable, ViewAndEditor } from "@/layouts/editors"
import { DetailIllust } from "@/functions/adapter-http/impl/illust"
import { useObjectEndpoint } from "@/functions/utils/endpoints/object-endpoint"
import { LocalDateTime } from "@/utils/datetime"
import { useIllustContext } from "./inject"
import style from "./style.module.scss"

//TODO 将整个pane view抽离至dataset layout

export default defineComponent({
    setup() {
        const { pane: { state, visible } } = useIllustContext()

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
        detailId: { type: null as any as PropType<number | null>, required: true }
    },
    setup(props) {
        const editMetaTagService = useEditMetaTagService()
        const { dataView } = useIllustContext()

        const path = toRef(props, "detailId")

        const { data, setData, refreshData } = useObjectEndpoint({
            path,
            get: httpClient => httpClient.illust.get,
            update: httpClient => httpClient.illust.update,
            afterUpdate(id, data: DetailIllust) {
                const index = dataView.proxy.syncOperations.find(i => i.id === id)
                if(index != undefined) dataView.proxy.syncOperations.modify(index, data)
            }
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
                editMetaTagService.edit({type: data.value.type, id: data.value.id}, refreshData)
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
    setup(props) {
        //TODO 多选模式和批量编辑
    }
})
