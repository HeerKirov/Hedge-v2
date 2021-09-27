import { computed, defineComponent, ref, watch } from "vue"
import Select from "@/components/forms/Select"
import { PaneBasicLayout } from "@/layouts/layouts/SplitPane"
import { AnnotationEditor, DescriptionEditor } from "@/layouts/editor-components"
import { IdResponse } from "@/functions/adapter-http/impl/generic"
import { SimpleIllust } from "@/functions/adapter-http/impl/illust"
import { SimpleAnnotation } from "@/functions/adapter-http/impl/annotations"
import { IsGroup, TagCreateForm, TagExceptions, TagLink, TagType } from "@/functions/adapter-http/impl/tag"
import { useObjectCreator } from "@/functions/utils/endpoints/object-creator"
import { useMessageBox } from "@/functions/module/message-box"
import { checkTagName } from "@/utils/check"
import { TAG_TYPE_SELECT_ITEMS } from "./define"
import { useTagListContext, useTagPaneContext } from "./inject"
import { NameAndOtherNamesEditor, TagGroupEditor, TagLinkEditor } from "./PaneComponents"
import style from "./style.module.scss"

export default defineComponent({
    setup() {
        const message = useMessageBox()
        const { createMode, openDetailPane, closePane } = useTagPaneContext()
        const { indexedInfo, syncAddTag } = useTagListContext()

        const address = computed(() => {
            const parentInfo = createMode.value?.parentId ? indexedInfo.value[createMode.value.parentId] : null
            if(parentInfo) {
                return parentInfo.address.map(i => i.name).concat(parentInfo.tag.name).join(".")
            }else{
                return null
            }
        })

        const isRootNode = computed(() => createMode.value?.parentId == null)

        const form = ref<FormData>(getDefaultFormData(createMode.value!.parentId, createMode.value!.ordinal))
        watch(createMode, template => {
            form.value.parentId = template?.parentId ?? null
            form.value.ordinal = template?.ordinal ?? null
        }, {deep: true})

        const creator = useObjectCreator({
            form,
            create: httpClient => httpClient.tag.create,
            mapForm: mapToCreateForm,
            beforeCreate(form) {
                if(!checkTagName(form.name)) {
                    message.showOkMessage("prompt", "不合法的名称。", "名称不能为空，且不能包含 ` \" ' . | 字符。")
                    return false
                }
                for(const otherName of form.otherNames) {
                    if(!checkTagName(otherName)) {
                        message.showOkMessage("prompt", "不合法的别名。", "别名不能为空，且不能包含 ` \" ' . | 字符。")
                        return
                    }
                }
            },
            afterCreate(result: IdResponse) {
                syncAddTag(result.id)
                openDetailPane(result.id)
            },
            handleError(e: TagExceptions["create"]) {
                if(e.code === "ALREADY_EXISTS") {
                    message.showOkMessage("prompt", "该名称已存在。")
                }else if(e.code === "NOT_EXIST") {
                    const [type, ids] = e.info
                    if(type === "parentId") {
                        message.showOkMessage("error", "选择的作为父标签的标签不存在。", `错误项: ${ids}`)
                    }else if(type === "links") {
                        message.showOkMessage("error", "选择的作为链接的标签不存在。", `错误项: ${ids}`)
                    }else if(type === "examples") {
                        message.showOkMessage("error", "选择的示例项不存在。", `错误项: ${ids}`)
                    }else if(type === "annotations") {
                        message.showOkMessage("error", "选择的注解不存在。", `错误项: ${ids}`)
                    }else{
                        message.showOkMessage("error", `选择的资源${type}不存在。`, `错误项: ${ids}`)
                    }
                }else if(e.code === "CANNOT_GIVE_COLOR") {
                    message.showOkMessage("prompt", "不能设置非根节点的颜色。它们的颜色始终跟随根节点。")
                }else if(e.code === "NOT_SUITABLE") {
                    const [type, ids] = e.info
                    if(type === "examples") {
                        message.showOkMessage("error", "选择的示例不可用。", `只能选择图像而非集合类型的项目作为示例。`)
                    }else if(type === "annotations") {
                        const content = ids.map(id => form.value.annotations?.find(i => i.id === id)?.name ?? "unknown").join(", ")
                        message.showOkMessage("error", "选择的注解不可用。", `选择的注解的导出目标设置使其无法导出至标签。错误项: ${content}`)
                    }else if(type === "links") {
                        const content = ids.map(id => form.value.links?.find(i => i.id === id)?.name ?? "unknown").join(", ")
                        message.showOkMessage("error", "选择的作为链接的标签不可用。", `虚拟地址段不能用作链接。错误项: ${content}`)
                    }else{
                        message.showOkMessage("prompt", `指定的资源${type}不适用。`)
                    }
                }else{
                    return e
                }
            }
        })

        const setNameAndOtherNames = ([name, otherNames, color]: [string, string[], string | null]) => {
            form.value.name = name
            form.value.otherNames = otherNames
            form.value.color = color
        }

        return () => <PaneBasicLayout onClose={closePane} class={style.paneDetailContent}>
            <p class="ml-m1"><button class="button is-white is-small" onClick={creator.save}><span class="icon"><i class="fa fa-check"/></span><span>保存</span></button></p>
            <p class={style.creatorTop}/>
            {address.value && <p class="can-be-selected mb-1">{address.value}</p>}
            <div class={style.title}>
                <NameAndOtherNamesEditor name={form.value.name} otherNames={form.value.otherNames} color={form.value.color ?? undefined} enableToSetColor={isRootNode.value} onSetValue={setNameAndOtherNames}/>
            </div>
            <div class={style.meta}>
                <Select class="mb-1" items={TAG_TYPE_SELECT_ITEMS} value={form.value.type} onUpdateValue={v => form.value.type = v}/>
                <TagGroupEditor value={form.value.group} onUpdateValue={v => form.value.group = v}/>
            </div>
            <p class={style.separator}/>
            <div class={style.annotations}>
                <AnnotationEditor class="mb-1" value={form.value.annotations} onUpdateValue={v => form.value.annotations = v} target="TAG"/>
            </div>
            <DescriptionEditor value={form.value.description} onUpdateValue={v => form.value.description = v}/>
            <div class={style.links}>
                <TagLinkEditor value={form.value.links} onUpdateValue={v => form.value.links = v}/>
            </div>
        </PaneBasicLayout>
    }
})

interface FormData {
    name: string
    parentId: number | null,
    ordinal: number | null,
    type: TagType
    otherNames: string[],
    group: IsGroup,
    links: TagLink[],
    annotations: SimpleAnnotation[],
    description: string,
    color: string | null,
    examples: SimpleIllust[]
}

function getDefaultFormData(parentId: number | null = null, ordinal: number | null = null): FormData {
    return {
        name: "",
        parentId,
        ordinal,
        type: "TAG",
        otherNames: [],
        group: "NO",
        links: [],
        annotations: [],
        description: "",
        color: null,
        examples: []
    }
}

function mapToCreateForm(form: FormData): TagCreateForm {
    return {
        name: form.name,
        parentId: form.parentId,
        ordinal: form.ordinal,
        type: form.type,
        otherNames: form.otherNames,
        group: form.group,
        links: form.links.map(i => i.id),
        annotations: form.annotations.map(a => a.id),
        description: form.description,
        color: form.color,
        examples: form.examples.map(e => e.id)
    }
}
