import { computed, defineComponent } from "vue"
import Starlight from "@/components/elements/Starlight"
import Select from "@/components/forms/Select"
import { AnnotationElement, TagGroupDisplay, TagTypeDisplay, TagGroupMemberDisplay, TagLinkDisplay } from "@/layouts/display-components"
import { PaneBasicLayout } from "@/layouts/layouts/SplitPane"
import { AnnotationEditor, DescriptionEditor, ViewAndEditor } from "@/layouts/editor-components"
import { DetailTag, IsGroup, TagLink, TagType, TagUpdateForm } from "@/functions/adapter-http/impl/tag"
import { SimpleAnnotation } from "@/functions/adapter-http/impl/annotations"
import { useObjectEndpoint } from "@/functions/utils/endpoints/object-endpoint"
import { useMessageBox } from "@/functions/module/message-box"
import { assetsUrl } from "@/functions/app"
import { objects } from "@/utils/primitives"
import { checkTagName } from "@/utils/check"
import { TAG_TYPE_SELECT_ITEMS } from "./define"
import {
    TagGroupEditor, NameAndOtherNamesEditor, TagLinkEditor,
    NameAndOtherNameDisplay, DescriptionDisplay
} from "./PaneComponents"
import { useTagPaneContext, useTagListContext, useTagTreeAccessor } from "./inject"
import style from "./style.module.scss"

export default defineComponent({
    setup() {
        const message = useMessageBox()
        const { detailMode, closePane } = useTagPaneContext()
        const { descriptionCache, syncUpdateTag } = useTagListContext()
        const { scrollIntoView } = useTagTreeAccessor()

        const { data, setData } = useObjectEndpoint({
            path: detailMode,
            get: httpClient => httpClient.tag.get,
            update: httpClient => httpClient.tag.update,
            afterGet(id, data: DetailTag) {
                descriptionCache.set(id, data.description)
            },
            afterUpdate(_, data: DetailTag) {
                syncUpdateTag(data)
            }
        })

        const computedInfo = computed<{address: string | null, member: boolean, memberIndex: number | null}>(() => {
            if(data.value !== null && data.value.parents.length) {
                const address = data.value.parents.map(i => i.name).join(".")
                const parent = data.value.parents[data.value.parents.length - 1]
                const member = parent.group !== "NO"
                const memberIndex = parent.group === "SEQUENCE" ? data.value.ordinal + 1 : null

                return {address, member, memberIndex}
            }else{
                return {address: null, member: false, memberIndex: null}
            }
        })

        const isRootNode = computed(() => data.value?.parentId == null)

        const setName = async ([name, otherNames, color]: [string, string[], string | null]) => {
            if(!checkTagName(name)) {
                message.showOkMessage("prompt", "不合法的名称。", "名称不能为空，且不能包含 ` \" ' . | 字符。")
                return false
            }
            if(otherNames.some(n => !checkTagName(n))) {
                message.showOkMessage("prompt", "不合法的别名。", "别名不能为空，且不能包含 ` \" ' . | 字符。")
                return false
            }

            const nameNotChanged = name === data.value?.name
            const otherNamesNotChanged = objects.deepEquals(otherNames, data.value?.otherNames)
            const colorNotChanged = color === data.value?.color

            return (nameNotChanged && otherNamesNotChanged && colorNotChanged) || await setData({
                name: nameNotChanged ? undefined : name,
                otherNames: otherNamesNotChanged ? undefined : otherNames,
                color: colorNotChanged ? undefined : (color ?? undefined)
            }, e => {
                if (e.code === "ALREADY_EXISTS") {
                    message.showOkMessage("prompt", "该名称已存在。")
                } else if(e.code === "CANNOT_GIVE_COLOR") {
                    message.showOkMessage("prompt", "不能设置非根节点的颜色。它们的颜色始终跟随根节点。")
                } else {
                    return e
                }
            })
        }

        const setAnnotations = async (annotations: SimpleAnnotation[]) => {
            return objects.deepEquals(annotations, data.value?.annotations) || await setData({ annotations: annotations.map(a => a.id) }, e => {
                if(e.code === "NOT_EXIST") {
                    const [type, ids] = e.info
                    if(type === "annotations") {
                        message.showOkMessage("error", "选择的注解不存在。", `错误项: ${ids}`)
                    }
                }else if(e.code === "NOT_SUITABLE") {
                    const [, ids] = e.info
                    const content = ids.map(id => annotations.find(i => i.id === id)?.name ?? "unknown").join(", ")
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

        const setLinks = async (links: TagLink[]) => {
            return objects.deepEquals(links, data.value?.links) || await setData({ links: links.map(i => i.id) }, e => {
                if(e.code === "NOT_EXIST") {
                    const [type, ids] = e.info
                    if(type === "links") {
                        message.showOkMessage("error", "选择的作为链接的标签不存在。", `错误项: ${ids}`)
                    }
                }else if(e.code === "NOT_SUITABLE") {
                    const [type, ids] = e.info
                    if(type === "links") {
                        const content = ids.map(id => links.find(i => i.id === id)?.name ?? "unknown").join(", ")
                        message.showOkMessage("error", "选择的作为链接的标签不可用。", `虚拟地址段不能用作链接。错误项: ${content}`)
                    }
                }else{
                    return e
                }
            })
        }

        return () => <PaneBasicLayout onClose={closePane} class={style.paneDetailContent}>
            {data.value && <>
                <p class={style.top}/>
                {computedInfo.value.address && <p class="can-be-selected">{computedInfo.value.address}</p>}
                <ViewAndEditor class={[style.title, "can-be-selected"]} baseline="medium" data={[data.value.name, data.value.otherNames, data.value.color]} onSetData={setName} v-slots={{
                    default: ({ value: [name, otherNames, color] }) => <NameAndOtherNameDisplay name={name} otherNames={otherNames} color={color}/>,
                    editor: ({ value: [name, otherNames, color], setValue, save }) => <NameAndOtherNamesEditor name={name} otherNames={otherNames} color={color} enableToSetColor={isRootNode.value} onSetValue={setValue} onSave={save}/>
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
                    <TagGroupMemberDisplay class="mt-1" member={computedInfo.value.member} memberIndex={computedInfo.value.memberIndex ?? undefined}/>
                </div>
                <p class={style.separator}/>
                <ViewAndEditor class={style.annotations} data={data.value.annotations} onSetData={setAnnotations} v-slots={{
                    default: ({ value }: {value: SimpleAnnotation[]}) => value.length ? value.map(a => <AnnotationElement key={a.id} value={a}/>) : <span class="tag"><i class="has-text-grey">没有注解</i></span>,
                    editor: ({ value, setValue }: {value: SimpleAnnotation[], setValue(v: SimpleAnnotation[])}) => <AnnotationEditor class="mb-1" value={value} onUpdateValue={setValue} target="TAG"/>
                }}/>
                <ViewAndEditor data={data.value.description} onSetData={setDescription} showEditButton={false} showSaveButton={false} v-slots={{
                    default: ({ value, edit }) => <DescriptionDisplay value={value} onEdit={edit}/>,
                    editor: ({ value, setValue, save }) => <DescriptionEditor value={value} onUpdateValue={setValue} onSave={save} showSaveButton={true}/>
                }}/>
                <div class={style.links}>
                    <ViewAndEditor data={data.value.links} onSetData={setLinks} v-slots={{
                        default: ({ value }: {value: TagLink[]}) => <TagLinkDisplay value={value} onClick={scrollIntoView}/>,
                        editor: ({ value, setValue }: {value: TagLink[], setValue(v: TagLink[])}) => <TagLinkEditor value={value} onUpdateValue={setValue}/>
                    }}/>
                </div>
                <div class={style.score}>
                    {data.value.score != null 
                        ? <Starlight showText={true} value={data.value.score}/>
                        : <i class="has-text-grey">暂无评分</i>}
                </div>
                <div class={style.examples}>
                    {/* TODO examples编辑的功能 */}
                    <label class="label">示例</label>
                    {data.value.examples.length ? <div class={style.exampleList}>
                        {data.value.examples.map(example => <div class={style.example}>
                            <img alt={example.thumbnailFile} src={assetsUrl(example.thumbnailFile)}/>
                        </div>)}
                    </div> : <i class="has-text-grey">没有示例</i>}
                </div>
            </>}
        </PaneBasicLayout>
    }
})
