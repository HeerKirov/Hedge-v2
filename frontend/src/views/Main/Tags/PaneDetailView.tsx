import { computed, defineComponent } from "vue"
import WrappedText from "@/components/elements/WrappedText"
import Starlight from "@/components/elements/Starlight"
import Textarea from "@/components/forms/Textarea"
import Select from "@/components/forms/Select"
import { PaneBasicLayout } from "@/layouts/layouts/SplitPane"
import { AnnotationEditor, ViewAndEditor } from "@/layouts/editor-components"
import { DetailTag, IsGroup, TagType, TagUpdateForm } from "@/functions/adapter-http/impl/tag"
import { SimpleAnnotation } from "@/functions/adapter-http/impl/annotations"
import { useObjectEndpoint } from "@/functions/utils/endpoints/object-endpoint"
import { useMessageBox } from "@/functions/module"
import { assetsUrl } from "@/functions/app"
import { objects } from "@/utils/primitives"
import { onKeyEnter } from "@/utils/events"
import { checkTagName } from "@/utils/check"
import {
    LinkElement,
    TagGroupEditor,
    TagTypeDisplay,
    TagGroupDisplay,
    TagGroupMemberDisplay,
    NameAndOtherNamesEditor,
    NameAndOtherNameDisplay, LinkDisplay
} from "./PaneComponents"
import { TAG_TYPE_SELECT_ITEMS } from "./define"
import { useTagContext } from "./inject"
import style from "./style.module.scss"

export default defineComponent({
    setup() {
        const message = useMessageBox()
        const { indexedInfo, detailMode, closePane } = useTagContext()

        const { data, setData } = useObjectEndpoint<number, DetailTag, TagUpdateForm>({
            path: detailMode,
            get: httpClient => httpClient.tag.get,
            update: httpClient => httpClient.tag.update,
            afterUpdate(id, data) {
                const info = indexedInfo.value[id]
                if(info) {
                    const tag = info.tag
                    tag.name = data.name
                    tag.otherNames = data.otherNames
                    tag.color = data.color
                    tag.type = data.type
                    tag.group = data.group
                }
            }
        })

        const attachedInfo = computed<{address: string | null, member: boolean, memberIndex: number | null}>(() => {
            const info = detailMode.value != null ? indexedInfo.value[detailMode.value] : null
            return info ? {
                address: info.address.length ? info.address.map(i => i.name).join(".") : null,
                member: info.member,
                memberIndex: info.memberIndex != undefined ? info.memberIndex + 1 : null
            } : {
                address: null,
                member: false,
                memberIndex: null
            }
        })

        const links = computed(() => (data.value?.links ?? []).map(link => indexedInfo.value[link]).filter(i => i != undefined).map(i => i.tag))

        const setName = async ([name, otherNames]: [string, string[]]) => {
            if(!checkTagName(name)) {
                message.showOkMessage("prompt", "不合法的名称。", "名称不能为空，且不能包含 ` \" ' . | 字符。")
                return false
            }
            if(otherNames.some(n => !checkTagName(n))) {
                message.showOkMessage("prompt", "不合法的别名。", "别名不能为空，且不能包含 ` \" ' . | 字符。")
                return false
            }
            return (name === data.value?.name && objects.deepEquals(otherNames, data.value?.otherNames)) || await setData({ name, otherNames }, e => {
                if (e.code === "ALREADY_EXISTS") {
                    message.showOkMessage("prompt", "该名称已存在。")
                } else {
                    return e
                }
            })
        }

        const setAnnotations = async (annotations: SimpleAnnotation[]) => {
            return objects.deepEquals(annotations, data.value?.annotations) || await setData({ annotations: annotations.map(a => a.id) }, e => {
                if(e.code === "NOT_EXIST") {
                    const [, id] = e.info
                    message.showOkMessage("error", "选择的注解不存在。", `错误项: ${id}`)
                }else if(e.code === "NOT_SUITABLE") {
                    const [, id] = e.info
                    const content = typeof id === "number" ? annotations.find(i => i.id === id)?.name ?? "unknown"
                        : typeof id === "object" ? id.map(id => annotations.find(i => i.id === id)?.name ?? "unknown").join(", ")
                        : id

                    message.showOkMessage("error", "选择的注解不可用。", `选择的注解的导出目标设置使其无法导出至标签。错误项: ${content}`)
                }else{
                    return e
                }
            })
        }

        const setDescription = async (description: string) => {
            return description === data.value?.description || await setData({ description })
        }

        const setType = async (type: TagType) => {
            return type === data.value?.type || await setData({ type })
        }

        const setGroup = async (group: IsGroup) => {
            return group === data.value?.group || await setData({ group })
        }

        return () => <PaneBasicLayout onClose={closePane} class={style.paneDetailContent}>
            {data.value && <>
                <p class={style.top}/>
                {attachedInfo.value.address && <p class="can-be-selected">{attachedInfo.value.address}</p>}
                <ViewAndEditor class={[style.title, "can-be-selected"]} baseline="medium" data={[data.value.name, data.value.otherNames]} onSetData={setName} v-slots={{
                    default: ({ value: [name, otherNames] }) => <NameAndOtherNameDisplay name={name} otherNames={otherNames} color={data.value?.color ?? undefined}/>,
                    editor: ({ value: [name, otherNames], setValue, save }) => <NameAndOtherNamesEditor name={name} otherNames={otherNames} onSetValue={setValue} onSave={save}/>
                }}/>
                <div class={style.meta}>
                    <ViewAndEditor data={data.value.type} onSetData={setType} v-slots={{
                        default: ({ value }) => <TagTypeDisplay value={value}/>,
                        editor: ({ value, setValue }) => <Select class="mt-m1" items={TAG_TYPE_SELECT_ITEMS} value={value} onUpdateValue={setValue}/>
                    }}/>
                    <ViewAndEditor class="mt-1" data={data.value.group} onSetData={setGroup} v-slots={{
                        default: ({ value }) => <TagGroupDisplay value={value}/>,
                        editor: ({ value, setValue }) => <TagGroupEditor value={value} onUpdateValue={setValue}/>
                    }}/>
                    <TagGroupMemberDisplay class="mt-1" member={attachedInfo.value.member} memberIndex={attachedInfo.value.memberIndex ?? undefined}/>
                </div>
                <p class={style.separator}/>
                <ViewAndEditor class={style.annotations} data={data.value.annotations} onSetData={setAnnotations} v-slots={{
                    default: ({ value }: {value: SimpleAnnotation[]}) => value.length ? value.map(a => <span key={a.id} class="tag">
                        <b>[</b><span class="mx-1">{a.name}</span><b>]</b>
                    </span>) : <span class="tag"><i class="has-text-grey">没有注解</i></span>,
                    editor: ({ value, setValue }: {value: SimpleAnnotation[], setValue(v: SimpleAnnotation[]): void}) => <AnnotationEditor class="mb-1" value={value} onUpdateValue={setValue} target="TAG"/>
                }}/>
                <ViewAndEditor data={data.value.description} onSetData={setDescription} showEditButton={false} showSaveButton={false} v-slots={{
                    default: ({ value, edit }) => <div class={[style.description, "block", "is-cursor-text"]} onClick={edit}>
                        {value ? <WrappedText value={value}/> : <i class="has-text-grey">没有描述</i>}
                    </div>,
                    editor: ({ value, setValue, save }) => <Textarea value={value} onUpdateValue={setValue} onKeypress={onKeyEnter(save)} refreshOnInput={true} focusOnMounted={true}/>
                }}/>
                <div class={style.links}>
                    {/* FUTURE: link编辑的功能 */}
                    <LinkDisplay value={links.value}/>
                </div>
                <div class={style.score}>
                    {data.value.score != null 
                        ? <Starlight showText={true} value={data.value.score}/>
                        : <i class="has-text-grey">暂无评分</i>}
                </div>
                <div class={style.examples}>
                    {/* FUTURE: 示例编辑的功能 */}
                    <label class="label">示例</label>
                    {data.value.examples.length ? <div class={style.exampleList}>
                        {data.value.examples.map(example => <div class={style.example}>
                            <img alt={example.thumbnailFile ?? ""} src={assetsUrl(example.thumbnailFile)}/>
                        </div>)}
                    </div> : <i class="has-text-grey">没有示例</i>}
                </div>
            </>}
        </PaneBasicLayout>
    }
})
