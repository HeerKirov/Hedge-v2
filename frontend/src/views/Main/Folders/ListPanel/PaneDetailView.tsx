import { computed, defineComponent } from "vue"
import Input from "@/components/forms/Input"
import { PaneBasicLayout } from "@/layouts/layouts/SplitPane"
import { TimeDisplay } from "@/layouts/displays"
import { ViewAndEditor } from "@/layouts/editors"
import { useMessageBox } from "@/functions/module/message-box"
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
                    {data.value.type === "QUERY"
                        ? <><i class="fa fa-search mr-1"/>查询</>
                    : data.value.type === "FOLDER"
                        ? <><i class="fa fa-folder mr-1"/>目录</>
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
