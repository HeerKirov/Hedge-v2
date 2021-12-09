import { defineComponent } from "vue"
import { TagmeInfo, ScoreDisplay, DescriptionDisplay, TimeDisplay, PartitionTimeDisplay, MetaTagListDisplay } from "@/layouts/displays"
import { DateEditor, DateTimeEditor, DescriptionEditor, StarlightEditor, ViewAndEditor, ViewAndEditable } from "@/layouts/editors"
import { LocalDateTime } from "@/utils/datetime"
import { usePreviewContext, useMetadataEndpoint } from "../inject"

export default defineComponent({
    setup() {
        const { detail: { id }, ui: { drawerTab } } = usePreviewContext()
        const { data, setData } = useMetadataEndpoint()

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

        const openMetaTagEditor = () => drawerTab.value = "metaTag"

        return () => <div>
            <p><i class="fa fa-id-card mr-2"/><b class="can-be-selected">{id.value}</b></p>
            {data.value && <>
                <ViewAndEditor class="mt-3" data={data.value.description} useEditorData editorData={data.value.originDescription} onSetData={setDescription} color="deep-light" showSaveButton={false} v-slots={{
                    default: ({ value }) => <DescriptionDisplay value={value}/>,
                    editor: ({ value, setValue, save }) => <DescriptionEditor value={value} onUpdateValue={setValue} onSave={save} showSaveButton={true}/>
                }}/>
                <ViewAndEditor class="mt-3" data={data.value.score} useEditorData editorData={data.value.originScore} onSetData={setScore} color="deep-light" baseline="medium" v-slots={{
                    default: ({ value }) => <ScoreDisplay class="pt-1" value={value}/>,
                    editor: ({ value, setValue }) => <StarlightEditor value={value} onUpdateValue={setValue}/>
                }}/>
                <ViewAndEditable class="mt-4" onEdit={openMetaTagEditor} color="deep-light">
                    {data.value.tagme.length > 0 && <TagmeInfo class="is-white" value={data.value.tagme}/>}
                    <MetaTagListDisplay authors={data.value.authors} topics={data.value.topics} tags={data.value.tags}/>
                </ViewAndEditable>
                <ViewAndEditor class="mt-2" data={data.value.partitionTime} onSetData={setPartitionTime} color="deep-light" baseline="medium" v-slots={{
                    default: ({ value }) => <PartitionTimeDisplay partitionTime={value}/>,
                    editor: ({ value, setValue }) => <DateEditor value={value} onUpdateValue={setValue}/>
                }}/>
                <ViewAndEditor class="mt-1" data={[data.value.orderTime, data.value.createTime, data.value.updateTime]} useEditorData editorData={data.value.orderTime} onSetData={setOrderTime} color="deep-light" baseline="medium" v-slots={{
                    default: ({ value: [orderTime, createTime, updateTime] }) => <TimeDisplay orderTime={orderTime} createTime={createTime} updateTime={updateTime}/>,
                    editor: ({ value, setValue }) => <DateTimeEditor value={value} onUpdateValue={setValue}/>
                }}/>
            </>}
        </div>
    }
})
