import { defineComponent } from "vue"
import Input from "@/components/forms/Input"
import { SideBar } from "@/layouts/layouts/SideLayout"
import { DescriptionEditor, StarlightEditor, ViewAndEditable, ViewAndEditor } from "@/layouts/editors"
import { MetaTagListDisplay, DescriptionDisplay, ScoreDisplay, TimeDisplay, TitleDisplay } from "@/layouts/displays"
import { usePreviewContext } from "./inject"

export default function() {
    return <SideBar>
        <SideBarDetailInfo/>
    </SideBar>
}

const SideBarDetailInfo = defineComponent({
    setup() {
        const { data: { id }, detailInfo: { data, setData }, ui: { drawerTab } } = usePreviewContext()

        const setTitle = async (title: string) => {
            return title === data.value?.title || await setData({ title })
        }
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
                <ViewAndEditor class="mt-3" data={data.value.title} onSetData={setTitle} baseline="medium" color="deep-light" v-slots={{
                    default: ({ value }) => <TitleDisplay value={value}/>,
                    editor: ({ value, setValue }) => <Input value={value} onUpdateValue={setValue}/>
                }}/>
                <ViewAndEditor class="mt-3" data={data.value.description} onSetData={setDescription} color="deep-light" showSaveButton={false} v-slots={{
                    default: ({ value }) => <DescriptionDisplay value={value}/>,
                    editor: ({ value, setValue, save }) => <DescriptionEditor value={value} onUpdateValue={setValue} onSave={save} showSaveButton={true}/>
                }}/>
                <ViewAndEditor class="mt-3" data={data.value.score} onSetData={setScore} color="deep-light" baseline="medium" v-slots={{
                    default: ({ value }) => <ScoreDisplay class="pt-1" value={value}/>,
                    editor: ({ value, setValue }) => <StarlightEditor value={value} onUpdateValue={setValue}/>
                }}/>
                <ViewAndEditable class="mt-4" onEdit={openMetaTagEditor} color="deep-light">
                    <MetaTagListDisplay authors={data.value.authors} topics={data.value.topics} tags={data.value.tags}/>
                </ViewAndEditable>
                <TimeDisplay class="mt-3" createTime={data.value.createTime} updateTime={data.value.updateTime}/>
            </>}
        </div>
    }
})
