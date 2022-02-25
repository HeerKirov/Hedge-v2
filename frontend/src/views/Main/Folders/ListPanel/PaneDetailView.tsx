import { computed, defineComponent, ref, watch } from "vue"
import Input from "@/components/forms/Input"
import GridImage from "@/components/elements/GridImage"
import { PaneBasicLayout } from "@/components/layouts/SplitPane"
import { ViewAndEditor } from "@/layouts/editors"
import { FolderImage } from "@/functions/adapter-http/impl/folder"
import { useHttpClient } from "@/services/app"
import { useToast } from "@/services/module/toast"
import { TimeDisplay } from "@/layouts/displays"
import { useMessageBox } from "@/services/module/message-box"
import { useFolderContext } from "../inject"
import style from "./style.module.scss"

export default defineComponent({
    setup() {
        const message = useMessageBox()
        const { pane, list: { indexedData, updateFolder } } = useFolderContext()

        const data = computed(() => pane.detailMode.value ? indexedData.value[pane.detailMode.value] : null)

        const setTitle = async (title: string) => {
            if(title.trim().length <= 0) {
                message.showOkMessage("prompt", "不合法的标题。", "标题不能为空。")
                return false
            }

            return title === data.value?.title || await updateFolder(pane.detailMode.value!, {title}, e => {
                if (e.code === "ALREADY_EXISTS") {
                    message.showOkMessage("prompt", "此标题的目录已存在。")
                } else {
                    return e
                }
            })
        }

        return () => <PaneBasicLayout onClose={pane.closePane} class={style.paneDetailContent}>
            {data.value && <>
                <p class={style.top}/>
                <ViewAndEditor class="can-be-selected" baseline="medium" data={data.value.title} onSetData={setTitle} v-slots={{
                    default: ({ value }) => <span class="is-size-medium">{value}</span>,
                    editor: ({ value, setValue }) => <Input value={value} onUpdateValue={setValue} refreshOnInput={true}/>
                }}/>
                <p class="mt-2">
                    {data.value.type === "FOLDER"
                        ? <><i class="fa fa-folder mr-1"/>目录</>
                    :
                        <><i class="fa fa-angle-right mr-1"/>节点</>
                    }
                </p>
                {data.value.type === "FOLDER" && <FolderExamples class="mt-4" id={pane.detailMode.value!}/>}
                <TimeDisplay class="mt-4" createTime={data.value.createTime} updateTime={data.value.updateTime}/>
            </>}
        </PaneBasicLayout>
    }
})

const FolderExamples = defineComponent({
    props: {
        id: {type: Number, required: true}
    },
    setup(props) {
        const toast = useToast()
        const httpClient = useHttpClient()
        const { view } = useFolderContext()

        const more = () => view.openDetailView(props.id)

        const items = ref<FolderImage[]>([])

        watch(() => props.id, async id => {
            items.value = []
            const res = await httpClient.folder.images.get(id, {offset: 0, limit: 9, order: "-ordinal"})
            if(res.ok) {
                items.value = res.data.result
            }else{
                toast.handleException(res.exception)
                items.value = []
            }
        }, {immediate: true})

        return () => items.value.length > 0 && <div>
            <GridImage value={items.value.map(e => e.thumbnailFile)} columnNum={3} radius="std" boxShadow={true}/>
            <div class="w-100 has-text-right">
                <a class="no-wrap" onClick={more}>查看全部内容<i class="fa fa-angle-double-right ml-1 mr-1"/></a>
            </div>
        </div>
    }
})
