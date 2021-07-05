import { defineComponent } from "vue"
import { SourceEditor, TagmeEditor, DateTimeEditor, ViewAndEditor, DateEditor } from "@/layouts/editor-components"
import { SourceInfo, TagmeInfo } from "@/layouts/display-components"
import { PaneBasicLayout } from "@/layouts/layouts/SplitPane"
import { useMessageBox } from "@/functions/document/message-box"
import { useObjectEndpoint } from "@/functions/utils/endpoints/object-endpoint"
import { DetailImportImage, ImportUpdateForm } from "@/functions/adapter-http/impl/import"
import { Tagme } from "@/functions/adapter-http/impl/illust"
import { assetsUrl } from "@/functions/app"
import { objects } from "@/utils/primitives"
import { date, datetime, LocalDateTime } from "@/utils/datetime"
import { useImportContext } from "./inject"
import style from "./style.module.scss"

export default defineComponent({
    setup() {
        const message = useMessageBox()
        const { pane: { detailMode, closePane }, list: { dataView } } = useImportContext()

        const { data, setData } = useObjectEndpoint<number, DetailImportImage, ImportUpdateForm>({
            path: detailMode,
            get: httpClient => httpClient.import.get,
            update: httpClient => httpClient.import.update,
            afterUpdate(id, data) {
                const index = dataView.proxy.syncOperations.find(annotation => annotation.id === id)
                if(index != undefined) dataView.proxy.syncOperations.modify(index, data)
            }
        })

        const setTagme = async (tagme: Tagme[]) => {
            return objects.deepEquals(tagme, data.value?.tagme) || await setData({tagme})
        }

        const setSourceInfo = async ({ source, sourceId, sourcePart }: { source: string | null, sourceId: number | null, sourcePart: number | null}) => {
            return (source === data.value?.source && sourceId === data.value?.sourceId && sourcePart === data.value?.sourcePart) || await setData({source, sourceId, sourcePart}, e => {
                if(e.code === "PARAM_REQUIRED") {
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

        return () => <PaneBasicLayout class={style.paneDetailContent} onClose={closePane}>
            {data.value && <>
                <p class={style.top}/>
                <div class={style.thumbnail}>
                    <img alt={data.value.fileName ?? undefined} src={assetsUrl(data.value.thumbnailFile)}/>
                </div>
                {data.value.fileName && <p class={[style.filename, "can-be-selected"]}><b>{data.value.fileName}</b></p>}
                {data.value.fileCreateTime && <p class="has-text-grey">文件创建时间 {datetime.toSimpleFormat(data.value.fileCreateTime)}</p>}
                {data.value.fileUpdateTime && <p class="has-text-grey">文件修改时间 {datetime.toSimpleFormat(data.value.fileUpdateTime)}</p>}
                {data.value.fileImportTime && <p class="has-text-grey">文件导入时间 {datetime.toSimpleFormat(data.value.fileImportTime)}</p>}
                <div class={style.separator}/>
                <ViewAndEditor data={{source: data.value.source, sourceId: data.value.sourceId, sourcePart: data.value.sourcePart}} onSetData={setSourceInfo} v-slots={{
                    default: ({ value }: {value: {source: string | null, sourceId: number | null, sourcePart: number | null}}) => <SourceInfo {...value}/>,
                    editor: ({ value, setValue }) => <SourceEditor {...value} onUpdateValue={setValue}/>
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
            </>}
        </PaneBasicLayout>
    }
})
