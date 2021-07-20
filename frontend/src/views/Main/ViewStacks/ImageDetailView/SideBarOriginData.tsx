import { defineComponent, ref } from "vue"
import WrappedText from "@/components/elements/WrappedText"
import { SourceEditor } from "@/layouts/editor-components"
import { useSettingSite } from "@/functions/api/setting"
import { useMessageBox } from "@/functions/document/message-box"
import { useOriginDataEndpoint } from "./inject"
import style from "./style.module.scss"

export default defineComponent({
    setup() {
        useSettingSite()
        const originData = useOriginDataEndpoint()

        return () => <div class={style.originDataPanel}>
            {originData.data.value && (originData.data.value.source !== null && originData.data.value.sourceId !== null ? <>
                <p>
                    <i class="fa fa-pager mr-2"/>
                    <span class="can-be-selected">
                        <span class="mr-1">{originData.data.value.sourceTitle ?? originData.data.value.source}</span>
                        <b>{originData.data.value.sourceId}</b>
                        {originData.data.value.sourcePart !== null && <b class="ml-1">p{originData.data.value.sourcePart}</b>}
                    </span>
                </p>
                <div class="my-2">
                    {originData.data.value.title !== null
                        ? <h1>{originData.data.value.title}</h1>
                        : <i class="has-text-grey">没有标题</i>}
                </div>
                <div class="my-2">
                    {originData.data.value.description !== null
                        ? <WrappedText value={originData.data.value.description}/>
                        : <i class="has-text-grey">没有描述</i>}
                </div>
                <div class="my-2">
                    {originData.data.value.parents.map(parent => <p><i class="fa fa-images mr-2"/>父项 <b>{parent}</b></p>)}
                    {originData.data.value.children.map(child => <p><i class="fa fa-images mr-2"/>子项 <b>{child}</b></p>)}
                </div>
                <div class="my-2">
                    {originData.data.value.pools.map(pool => <p><i class="fa fa-clone mr-2"/>Pool 《<b>{pool}</b>》</p>)}
                </div>
                <div class={[style.sourceTag, "can-be-selected"]}>
                    {originData.data.value.tags.map(tag => <p class={style.tag}>
                        <i class="fa fa-tag mr-2"/>
                        <a><b>{tag.name}</b>{tag.displayName !== null && ` (${tag.displayName})`}</a>
                    </p>)}
                </div>
            </> : <NoOriginDataBoard/>)}
        </div>
    }
})

const NoOriginDataBoard = defineComponent({
    setup() {
        const message = useMessageBox()
        const originData = useOriginDataEndpoint()

        const createMode = ref(false)

        const source = ref<{source: string | null, sourceId: number | null, sourcePart: number | null}>({source: null, sourceId: null, sourcePart: null})

        const save = async () => {
            const ok = await originData.setData({...source.value}, e => {
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
            <SourceEditor {...source.value} onUpdateValue={v => source.value = v}/>
            <p class="mt-2"><a onClick={save}><i class="fa fa-save mr-1"/>创建或使用此来源数据项</a></p>
        </div> : <div class={style.noOriginData}>
            <i>没有相关的来源数据</i>
            <p class="mt-2"><a onClick={() => createMode.value = true}><i class="fa fa-plus mr-1"/>添加来源数据项</a></p>
        </div>
    }
})
