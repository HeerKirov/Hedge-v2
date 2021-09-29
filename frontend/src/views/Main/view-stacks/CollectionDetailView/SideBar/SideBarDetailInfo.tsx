import { defineComponent } from "vue"
import { DescriptionDisplay, MetaTagListDisplay, PartitionTimeDisplay, ScoreDisplay, TagmeInfo, TimeDisplay } from "@/layouts/displays"
import { DescriptionEditor, StarlightEditor, ViewAndEditable, ViewAndEditor } from "@/layouts/editors"
import { usePreviewContext, useMetadataEndpoint } from "../inject"

export default defineComponent({
    setup() {
        const { data: { id }, ui: { drawerTab } } = usePreviewContext()
        const { data, setData } = useMetadataEndpoint()

        const setDescription = async (description: string) => {
            return description === data.value?.description || await setData({ description })
        }
        const setScore = async (score: number | null) => {
            return score === data.value?.score || await setData({ score })
        }

        const openMetaTagEditor = () => drawerTab.value = "metaTag"

        return () => <div>
            <p><i class="fa fa-id-card mr-2"/><b class="can-be-selected">{id.value}</b></p>
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
                <PartitionTimeDisplay class="mt-2" partitionTime={data.value.partitionTime}/>
                <TimeDisplay class="mt-1" orderTime={data.value.orderTime} createTime={data.value.createTime} updateTime={data.value.updateTime}/>
            </>}
        </div>
    }
})
