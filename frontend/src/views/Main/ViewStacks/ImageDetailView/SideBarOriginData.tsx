import { defineComponent, ref } from "vue"
import WrappedText from "@/components/elements/WrappedText"
import Input from "@/components/forms/Input"
import { SourceInfo } from "@/layouts/display-components"
import { DescriptionEditor, SourceEditor, ViewAndEditor } from "@/layouts/editor-components"
import { SourceTag } from "@/functions/adapter-http/impl/illust"
import { installSettingSite } from "@/functions/api/setting"
import { useMessageBox } from "@/functions/document/message-box"
import { useOriginDataEndpoint } from "./inject"
import style from "./style.module.scss"

export default defineComponent({
    setup() {
        installSettingSite()
        const { data, setData } = useOriginDataEndpoint()

        const setTitle = async (title: string) => {
            return title === data.value?.title || await setData({ title })
        }
        const setDescription = async (description: string) => {
            return description === data.value?.description || await setData({ description })
        }
        const setRelations = async ({ parents, children, pools }: {parents: number[], children: number[], pools: string[]}) => {
            const parentsEq = parents === data.value?.parents
            const childrenEq = children === data.value?.children
            const poolsEq = pools === data.value?.pools
            return (parentsEq && childrenEq && poolsEq) || await setData({parents, children, pools})
        }
        const setTags = async (tags: SourceTag[]) => {
            return tags === data.value?.tags || await setData({ tags })
        }

        return () => <div class={style.originDataPanel}>
            {data.value && (data.value.source !== null && data.value.sourceId !== null ? <>
                <SourceInfo source={data.value.source} sourceId={data.value.sourceId} sourcePart={data.value.sourcePart}/>
                <ViewAndEditor class="my-2" data={data.value.title} onSetData={setTitle} baseline="medium" v-slots={{
                    default: ({ value }) => <TitleDisplay value={value}/>,
                    editor: ({ value, setValue }) => <Input value={value} onUpdateValue={setValue} refreshOnInput={true} focusOnMounted={true}/>
                }}/>
                <ViewAndEditor class="my-2" data={data.value.description} onSetData={setDescription} showSaveButton={false} v-slots={{
                    default: ({ value }) => <DescriptionDisplay value={value}/>,
                    editor: ({ value, setValue, save }) => <DescriptionEditor value={value ?? ""} onUpdateValue={setValue} onSave={save} showSaveButton={true}/>
                }}/>
                <ViewAndEditor class="my-2" data={{parents: data.value.parents, children: data.value.children, pools: data.value.pools}} onSetData={setRelations} v-slots={{
                    default: ({ value: { parents, children, pools } }: {value: {parents: number[], children: number[], pools: string[]}}) => <RelationsDisplay parents={parents} children={children} pools={pools}/>,
                    editor: ({ value, setValue }) => undefined
                }}/>
                <ViewAndEditor class="my-2" data={data.value.tags} onSetData={setTags} v-slots={{
                    default: ({ value }: {value: SourceTag[]}) => <SourceTagsDisplay value={value}/>,
                    editor: ({ value, setValue }) => undefined
                }}/>
            </> : <NoOriginDataBoard/>)}
        </div>
    }
})

const NoOriginDataBoard = defineComponent({
    setup() {
        const message = useMessageBox()
        const { setData } = useOriginDataEndpoint()

        const createMode = ref(false)

        const source = ref<{source: string | null, sourceId: number | null, sourcePart: number | null}>({source: null, sourceId: null, sourcePart: null})

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
            <SourceEditor {...source.value} onUpdateValue={v => source.value = v}/>
            <p class="mt-2"><a onClick={save}><i class="fa fa-save mr-1"/>创建或使用此来源数据项</a></p>
        </div> : <div class={style.noOriginData}>
            <i>没有相关的来源数据</i>
            <p class="mt-2"><a onClick={() => createMode.value = true}><i class="fa fa-plus mr-1"/>添加来源数据项</a></p>
        </div>
    }
})

function TitleDisplay({ value }: {value: string | null}) {
    return value ? <p class="py-1 is-size-medium">{value}</p> : <i class="has-text-grey">没有标题</i>
}

function DescriptionDisplay({ value }: {value: string | null}) {
    return value ? <WrappedText value={value}/> : <i class="has-text-grey">没有描述</i>
}

function RelationsDisplay({ parents, children, pools }: {parents: number[], children: number[], pools: string[]}) {
    if(parents.length || children.length || pools.length) {
        return <>
            {(parents.length || children.length || null) && <div class="my-2">
                {parents.map(parent => <p><i class="fa fa-images mr-2"/>父项 <b>{parent}</b></p>)}
                {children.map(child => <p><i class="fa fa-images mr-2"/>子项 <b>{child}</b></p>)}
            </div>}
            {(pools.length || null) && <div class="my-2">
                {pools.map(pool => <p><i class="fa fa-clone mr-2"/>Pool 《<b>{pool}</b>》</p>)}
            </div>}
        </>
    }else{
        return <div class="my-2">
            <i class="has-text-grey">没有关联项目</i>
        </div>
    }
}

function SourceTagsDisplay({ value }: {value: SourceTag[]}) {
    return value.length ? <div class={[style.sourceTag, "can-be-selected"]}>
        {value.map(tag => <p class={style.tag}>
            <i class="fa fa-tag mr-2"/>
            <a><b>{tag.name}</b>{tag.displayName !== null && ` (${tag.displayName})`}</a>
        </p>)}
    </div> : <div>
        <i class="has-text-grey">没有原始标签</i>
    </div>
}
