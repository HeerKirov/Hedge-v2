import { defineComponent, reactive, watch } from "vue"
import TopBarTransparentLayout from "@/layouts/layouts/TopBarTransparentLayout"
import { useMessageBox } from "@/functions/document/message-box"
import { TopicCreateForm } from "@/functions/adapter-http/impl/topic"
import { objects } from "@/utils/primitives"
import { useTopicContext } from "../inject"
import { IdResponse } from "@/functions/adapter-http/impl/generic"
import { useObjectCreator } from "@/functions/utils/endpoints/object-creator"
import { checkTagName } from "@/utils/check"
import FormEditor, { FormEditorData } from "./FormEditor"

export default defineComponent({
    setup() {
        const message = useMessageBox()
        const { createMode, listEndpoint, openDetailPane } = useTopicContext()

        const form: CreatorData = reactive(objects.deepCopy(createMode.value!!))

        function update<T extends CreatorProps>(key: T, value: CreatorData[T]) {
            form[key] = value
        }

        watch(createMode, template => {
            if(template != null) {
                form.name = template.name
                form.otherNames = objects.deepCopy(template.otherNames)
                form.parent = objects.deepCopy(template.parent)
                form.type = template.type
                form.description = template.description
                form.keywords = objects.deepCopy(template.keywords)
                form.links = objects.deepCopy(template.links)
                form.annotations = objects.deepCopy(template.annotations)
                form.favorite = template.favorite
                form.score = template.score
            }
        })

        const creator = useObjectCreator({
            form,
            create: httpClient => form => httpClient.topic.create(mapFromCreatorData(form)),
            beforeCreate(form): boolean | void {
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
                for(const link of form.links) {
                    if(!link.title.trim() || !link.link.trim()) {
                        message.showOkMessage("prompt", "不合法的链接内容。", "链接的标题和内容不能为空。")
                    }
                }
            },
            afterCreate(result: IdResponse) {
                openDetailPane(result.id)
                listEndpoint.refresh()
            },
            handleError(e) {
                if(e.code === "ALREADY_EXISTS") {
                    message.showOkMessage("prompt", "该名称已存在。")
                }else if(e.code === "NOT_EXIST") {
                    const [type, id] = e.info
                    if(type === "annotations") {
                        message.showOkMessage("error", "选择的注解不存在。", `错误项: ${id}`)
                    }else if(type === "parentId") {
                        message.showOkMessage("error", "选择的父主题不存在。", `错误项: ${id}`)
                    }else{
                        message.showOkMessage("error", `选择的资源${type}不存在。`, `错误项: ${id}`)
                    }
                }else if(e.code === "NOT_SUITABLE") {
                    const [, id] = e.info
                    const content = typeof id === "number" ? form.annotations?.find(i => i.id === id)?.name ?? "unknown"
                        : typeof id === "object" ? id.map(id => form.annotations?.find(i => i.id === id)?.name ?? "unknown").join(", ")
                            : id

                    message.showOkMessage("error", "选择的注解不可用。", `选择的注解的导出目标设置使其无法导出至当前主题类型。错误项: ${content}`)
                }else if(e.code === "RECURSIVE_PARENT") {
                    message.showOkMessage("prompt", "无法应用此父主题。", "此父主题与当前主题存在闭环。")
                }else if(e.code === "ILLEGAL_CONSTRAINT") {
                    message.showOkMessage("prompt", "无法应用主题类型。", "当前主题的类型与其与父主题/子主题不能兼容。考虑更改父主题，或更改当前主题的类型。")
                }else{
                    return e
                }
            }
        })

        return () => <TopBarTransparentLayout paddingForTopBar={true} scrollable={true} v-slots={{
            topBar: () => <TopBarContent onSave={creator.save}/>,
            default: () => <FormEditor data={form} onUpdate={update}/>
        }}/>
    }
})

const TopBarContent = defineComponent({
    emits: ["save"],
    setup(_, { emit }) {
        const { closePane } = useTopicContext()

        const save = () => emit("save")

        return () => <div class="middle-layout">
            <div class="layout-container">
                <button class="square button no-drag radius-large is-white mr-1" onClick={closePane}>
                    <span class="icon"><i class="fa fa-times"/></span>
                </button>
            </div>
            <div class="layout-container">
                <button class="button no-drag radius-large is-white" onClick={save}>
                    <span class="icon"><i class="fa fa-check"/></span>
                    <span>保存</span>
                </button>
            </div>
        </div>
    }
})

function mapFromCreatorData(form: CreatorData): TopicCreateForm {
    return {
        name: form.name,
        otherNames: form.otherNames,
        parentId: form.parent?.id,
        type: form.type,
        description: form.description,
        keywords: form.keywords,
        links: form.links,
        annotations: form.annotations.map(a => a.id),
        score: form.score
    }
}

export interface CreatorData extends FormEditorData {
    favorite: boolean
}

type CreatorProps = keyof CreatorData
