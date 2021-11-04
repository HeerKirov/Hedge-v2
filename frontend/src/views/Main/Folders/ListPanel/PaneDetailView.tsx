import { defineComponent } from "vue"
import Input from "@/components/forms/Input"
import { PaneBasicLayout } from "@/layouts/layouts/SplitPane"
import { TimeDisplay } from "@/layouts/displays"
import { ViewAndEditor } from "@/layouts/editors"
import { useMessageBox } from "@/functions/module/message-box"
import { useObjectEndpoint } from "@/functions/utils/endpoints/object-endpoint"
import { Folder } from "@/functions/adapter-http/impl/folder"
import { useFolderContext } from "../inject"
import style from "./style.module.scss"

export default defineComponent({
    setup() {
        const message = useMessageBox()
        const { pane } = useFolderContext()

        const { data, setData } = useObjectEndpoint({
            path: pane.detailMode,
            get: httpClient => httpClient.folder.get,
            update: httpClient => httpClient.folder.update,
            afterUpdate(_, data: Folder) {

            }
        })

        const setTitle = async (title: string) => {
            if(title.trim().length <= 0) {
                message.showOkMessage("prompt", "不合法的标题。", "标题不能为空。")
                return false
            }

            return title === data.value?.title || await setData({title}, e => {
                if (e.code === "ALREADY_EXISTS") {
                    message.showOkMessage("prompt", "该标题的文件夹已存在。")
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
                    {data.value.type === "QUERY"
                        ? <><i class="fa fa-search mr-1"/>查询</>
                    : data.value.type === "FOLDER"
                        ? <><i class="fa fa-folder mr-1"/>文件夹</>
                    :
                        <><i class="fa fa-angle-right mr-1"/>节点</>
                    }
                </p>
                {data.value.type === "QUERY" && <div class="block mt-4 p-1">
                    <code>{data.value.query}</code>
                </div>}
                {data.value.type === "FOLDER" && <div class="mt-4">
                    {/*TODO 添加examples展示*/}
                </div>}
                <TimeDisplay class="mt-4" createTime={data.value.createTime} updateTime={data.value.updateTime}/>
            </>}
        </PaneBasicLayout>
    }
})
