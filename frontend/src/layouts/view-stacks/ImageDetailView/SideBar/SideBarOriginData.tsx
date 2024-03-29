import { defineComponent, ref } from "vue"
import { SourceInfo, TitleDisplay, DescriptionDisplay, SourceRelationsDisplay, SourceTagListDisplay, SourceStatusDisplay } from "@/layouts/displays"
import { SourceIdentityEditor, SourceStatusEditor, ViewAndEditable, ViewAndEditor, SourceIdentity, VAEDisplay, VAEEditor } from "@/layouts/editors"
import { SourceImageStatus } from "@/functions/adapter-http/impl/source-image"
import { installSettingSite } from "@/services/api/setting"
import { useMessageBox } from "@/services/module/message-box"
import { usePreviewContext, useOriginDataEndpoint } from "../inject"
import style from "./style.module.scss"

export default defineComponent({
    setup() {
        installSettingSite()
        const message = useMessageBox()
        const { ui: { drawerTab } } = usePreviewContext()
        const { data, setData } = useOriginDataEndpoint()

        const getSourceIdentity = (): SourceIdentity => ({source: data.value!.source, sourceId: data.value!.sourceId, sourcePart: data.value!.sourcePart})

        const setSourceIdentity = async (value: SourceIdentity) => {
            return (value.source === data.value?.source && value.sourceId === data.value?.sourceId && value.sourcePart === data.value?.sourcePart) || await setData(value, e => {
                if(e.code === "NOT_EXIST") {
                    message.showOkMessage("error", `来源${value.source}不存在。`)
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

        const setSourceStatus = async (status: SourceImageStatus) => {
            return (status === data.value?.status) || await setData({status})
        }

        const openSourceEditor = () => drawerTab.value = "source"

        return () => <div class={style.originDataPanel}>
            {data.value && (data.value.source !== null && data.value.sourceId !== null ? <>
                <ViewAndEditor data={getSourceIdentity()} onSetData={setSourceIdentity} color="deep-light" v-slots={{
                    default: ({ value }: VAEDisplay<SourceIdentity>) => <SourceInfo {...value}/>,
                    editor: ({ value, setValue }: VAEEditor<SourceIdentity>) => <SourceIdentityEditor {...value} onUpdateValue={setValue}/>
                }}/>
                <ViewAndEditor class="mt-2" data={data.value.status} onSetData={setSourceStatus} color="deep-light" v-slots={{
                    default: ({ value }: VAEDisplay<SourceImageStatus>) => <SourceStatusDisplay value={value}/>,
                    editor: ({ value, setValue }: VAEEditor<SourceImageStatus>) => <SourceStatusEditor value={value} onUpdateValue={setValue}/>
                }}/>
                <ViewAndEditable class="mt-2" baseline="medium" onEdit={openSourceEditor} color="deep-light">
                    <TitleDisplay value={data.value.title}/>
                    <DescriptionDisplay value={data.value.description}/>
                    <SourceRelationsDisplay relations={data.value.relations} pools={data.value.pools}/>
                    <SourceTagListDisplay value={data.value.tags}/>
                </ViewAndEditable>
            </> : <NoOriginDataBoard/>)}
        </div>
    }
})

const NoOriginDataBoard = defineComponent({
    setup() {
        const message = useMessageBox()
        const { setData } = useOriginDataEndpoint()

        const createMode = ref(false)

        const source = ref<SourceIdentity>({source: null, sourceId: null, sourcePart: null})

        const save = async () => {
            const ok = await setData({...source.value}, e => {
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
            if(ok) {
                createMode.value = false
            }
        }

        return () => createMode.value ? <div>
            <SourceIdentityEditor {...source.value} onUpdateValue={v => source.value = v}/>
            <p class="mt-2"><a onClick={save}><i class="fa fa-save mr-1"/>创建或使用此来源数据项</a></p>
        </div> : <div class={style.noOriginData}>
            <i>没有相关的来源数据</i>
            <p class="mt-2"><a onClick={() => createMode.value = true}><i class="fa fa-plus mr-1"/>添加来源数据项</a></p>
        </div>
    }
})
