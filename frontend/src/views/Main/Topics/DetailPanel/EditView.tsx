import { defineComponent } from "vue"
import TopBarTransparentLayout from "@/layouts/layouts/TopBarTransparentLayout"
import { TopicUpdateForm } from "@/functions/adapter-http/impl/topic"
import { useMessageBox } from "@/functions/module/message-box"
import { useMutableComputed } from "@/functions/utils/basic"
import { objects } from "@/utils/primitives"
import { checkTagName } from "@/utils/check"
import FormEditor, { FormEditorData } from "./FormEditor"
import { useTopicDetailContext } from "./inject"

export default defineComponent({
    setup() {
        const message = useMessageBox()
        const { data, setData, editMode } = useTopicDetailContext()

        const editorData = useMutableComputed<FormEditorData | null>(() => data.value && ({
            name: data.value.name,
            otherNames: data.value.otherNames,
            type: data.value.type,
            parent: data.value.parent,
            annotations: data.value.annotations,
            keywords: data.value.keywords,
            description: data.value.description,
            links: data.value.links,
            score: data.value.score,
            mappingSourceTags: data.value.mappingSourceTags
        }))

        function update<T extends EditorProps>(key: T, value: FormEditorData[T]) {
            if(editorData.value) {
                editorData.value[key] = value
            }
        }

        const save = async () => {
            if(editorData.value && data.value) {
                const form: TopicUpdateForm = {
                    type: editorData.value.type !== data.value.type ? editorData.value.type : undefined,
                    parentId: (editorData.value.parent?.id ?? null) !== (data.value.parent?.id ?? null) ? (editorData.value.parent?.id ?? null) : undefined,
                    annotations: !objects.deepEquals(editorData.value.annotations.map(i => i.id), data.value.annotations.map(i => i.id)) ? editorData.value.annotations.map(i => i.id) : undefined,
                    keywords: !objects.deepEquals(editorData.value.keywords, data.value.keywords) ? editorData.value.keywords : undefined,
                    description: editorData.value.description !== data.value.description ? editorData.value.description : undefined,
                    score: editorData.value.score !== data.value.score ? editorData.value.score : undefined,
                    mappingSourceTags: !objects.deepEquals(editorData.value.mappingSourceTags, data.value.mappingSourceTags) ? editorData.value.mappingSourceTags : undefined
                }
                if(editorData.value.name !== data.value.name) {
                    if(!checkTagName(editorData.value.name)) {
                        message.showOkMessage("prompt", "不合法的名称。", "名称不能为空，且不能包含 ` \" ' . | 字符。")
                        return
                    }
                    form.name = editorData.value.name
                }
                if(!objects.deepEquals(editorData.value.otherNames, data.value.otherNames)) {
                    for(const otherName of editorData.value.otherNames) {
                        if(!checkTagName(otherName)) {
                            message.showOkMessage("prompt", "不合法的别名。", "别名不能为空，且不能包含 ` \" ' . | 字符。")
                            return
                        }
                    }
                    form.otherNames = editorData.value.otherNames
                }
                if(!objects.deepEquals(editorData.value.links, data.value.links)) {
                    for(const link of editorData.value.links) {
                        if(!link.title.trim() || !link.link.trim()) {
                            message.showOkMessage("prompt", "不合法的链接内容。", "链接的标题和内容不能为空。")
                        }
                    }
                    form.links = editorData.value.links
                }

                const r = !Object.values(form).filter(i => i !== undefined).length || await setData(form, e => {
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
                        const content = typeof id === "number" ? editorData.value?.annotations?.find(i => i.id === id)?.name ?? "unknown"
                            : typeof id === "object" ? id.map(id => editorData.value?.annotations?.find(i => i.id === id)?.name ?? "unknown").join(", ")
                                : id

                        message.showOkMessage("error", "选择的注解不可用。", `选择的注解的导出目标设置使其无法导出至当前主题类型。错误项: ${content}`)
                    }else if(e.code === "RECURSIVE_PARENT") {
                        message.showOkMessage("prompt", "无法应用此父主题。", "此父主题与当前主题存在闭环。")
                    }else if(e.code === "ILLEGAL_CONSTRAINT") {
                        message.showOkMessage("prompt", "无法应用主题类型。", "当前主题的类型与其与父主题/子主题不能兼容。考虑更改父主题，或更改当前主题的类型。")
                    }else{
                        return e
                    }
                })
                if(r) {
                   editMode.value = false
                }
            }
        }

        return () => <TopBarTransparentLayout paddingForTopBar={true} scrollable={true} v-slots={{
            topBar: () => <TopBarContent onSave={save}/>,
            default: () => editorData.value ? <FormEditor data={editorData.value} onUpdate={update}/> : <div/>
        }}/>
    }
})

const TopBarContent = defineComponent({
    emits: ["save"],
    setup(_, { emit }) {
        const { editMode } = useTopicDetailContext()

        const cancel = () => editMode.value = false
        const save = () => emit("save")

        return () => <div class="middle-layout">
            <div class="layout-container">
                <button class="square button no-drag radius-large is-white mr-1" onClick={cancel}>
                    <span class="icon"><i class="fa fa-times"/></span>
                </button>
            </div>
            <div class="layout-container">
                <button class="square button no-drag radius-large is-link" onClick={save}>
                    <span class="icon"><i class="fa fa-save"/></span>
                </button>
            </div>
        </div>
    }
})

type EditorProps = keyof FormEditorData
