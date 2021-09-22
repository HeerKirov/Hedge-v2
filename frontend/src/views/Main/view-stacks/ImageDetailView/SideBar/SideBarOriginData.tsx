import { defineComponent, PropType, ref } from "vue"
import WrappedText from "@/components/elements/WrappedText"
import { SourceInfo } from "@/layouts/display-components"
import { SourceEditor, ViewAndEditable, ViewAndEditor, SourceIdentity } from "@/layouts/editor-components"
import { SourceTag } from "@/functions/adapter-http/impl/illust"
import { installSettingSite } from "@/functions/api/setting"
import { useMessageBox } from "@/functions/document/message-box"
import { useDetailViewContext, useOriginDataEndpoint } from "../inject"
import style from "./style.module.scss"

export default defineComponent({
    setup() {
        installSettingSite()
        const message = useMessageBox()
        const { ui: { drawerTab } } = useDetailViewContext()
        const { data, setData } = useOriginDataEndpoint()

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

        const openSourceEditor = () => drawerTab.value = "source"

        return () => <div class={style.originDataPanel}>
            {data.value && (data.value.source !== null && data.value.sourceId !== null ? <>
                <ViewAndEditor data={{source: data.value.source, sourceId: data.value.sourceId, sourcePart: data.value.sourcePart}} onSetData={setSourceIdentity} v-slots={{
                    default: ({ value}: {value: SourceIdentity}) => <SourceInfo {...value}/>,
                    editor: ({ value, setValue }: {value: SourceIdentity, setValue(_: SourceIdentity)}) => <SourceEditor {...value} onUpdateValue={setValue}/>
                }}/>
                <ViewAndEditable class="mt-2" onEdit={openSourceEditor}>
                    <TitleDisplay value={data.value.title}/>
                    <DescriptionDisplay value={data.value.description}/>
                    <RelationsDisplay parents={data.value.parents} children={data.value.children} pools={data.value.pools}/>
                    <SourceTagDisplay value={data.value.tags}/>
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
            <SourceEditor {...source.value} onUpdateValue={v => source.value = v}/>
            <p class="mt-2"><a onClick={save}><i class="fa fa-save mr-1"/>创建或使用此来源数据项</a></p>
        </div> : <div class={style.noOriginData}>
            <i>没有相关的来源数据</i>
            <p class="mt-2"><a onClick={() => createMode.value = true}><i class="fa fa-plus mr-1"/>添加来源数据项</a></p>
        </div>
    }
})

function TitleDisplay({ value }: {value: string | null}) {
    return value ? <p class="py-1 is-size-medium can-be-selected">{value}</p> : <i class="has-text-grey">没有标题</i>
}

function DescriptionDisplay({ value }: {value: string | null}) {
    return value ? <WrappedText class="can-be-selected" value={value}/> : <i class="has-text-grey">没有描述</i>
}

function RelationsDisplay({ parents, children, pools }: {parents: number[], children: number[], pools: string[]}) {
    if(parents.length || children.length || pools.length) {
        return <>
            {(parents.length || children.length || null) && <div class="my-2">
                {parents.map(parent => <p><i class="fa fa-images mr-2"/>父项 <b class="can-be-selected">{parent}</b></p>)}
                {children.map(child => <p><i class="fa fa-images mr-2"/>子项 <b class="can-be-selected">{child}</b></p>)}
            </div>}
            {(pools.length || null) && <div class="my-2">
                {pools.map(pool => <p><i class="fa fa-clone mr-2"/>Pool 《<b class="can-be-selected">{pool}</b>》</p>)}
            </div>}
        </>
    }else{
        return <div class="my-2">
            <i class="has-text-grey">没有关联项目</i>
        </div>
    }
}

function SourceTagDisplay({ value }: {value: SourceTag[]}) {
    return value.length ? <div class={[style.sourceTag, "can-be-selected"]}>
        {value.map(tag => <SourceTagDisplayItem value={tag}/>)}
    </div> : <div>
        <i class="has-text-grey">没有原始标签</i>
    </div>
}

function SourceTagDisplayItem({ value }: {value: SourceTag}) {
    return <p class={style.tag}>
        <i class="fa fa-tag mr-2"/>
        <a><b>{value.name}</b>{value.displayName !== null && ` (${value.displayName})`}</a>
    </p>
}

const SourceTagEditor = defineComponent({
    props: {
        value: {type: Array as PropType<SourceTag[]>, required: true}
    },
    emits: ["updateValue"],
    setup(props, { emit }) {
        return () => <div class={[style.sourceTag, "can-be-selected"]}>
            {props.value.map(tag => <SourceTagEditorItem value={tag}/>)}
        </div>
    }
})

function SourceTagEditorItem({ value }: {value: SourceTag}) {
    return <p class={style.tag}>
        <i class="fa fa-tag mr-2"/>
        <a><b>{value.name}</b>{value.displayName !== null && ` (${value.displayName})`}</a>
    </p>
}
