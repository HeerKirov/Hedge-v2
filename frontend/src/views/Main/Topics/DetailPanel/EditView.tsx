import { computed, defineComponent, PropType, Ref } from "vue"
import Input from "@/components/forms/Input"
import Textarea from "@/components/forms/Textarea"
import Select, { SelectItem } from "@/components/forms/Select"
import TopBarTransparentLayout from "@/layouts/layouts/TopBarTransparentLayout"
import { AnnotationEditor, LinkEditor, OtherNameEditor, StarlightEditor } from "@/layouts/editor-components"
import { Link } from "@/functions/adapter-http/impl/generic"
import { AnnotationTarget, SimpleAnnotation } from "@/functions/adapter-http/impl/annotations"
import { ParentTopic, TopicType, TopicUpdateForm } from "@/functions/adapter-http/impl/topic"
import { useMessageBox } from "@/functions/document/message-box"
import { useMutableComputed } from "@/functions/utils/basic"
import { objects } from "@/utils/primitives"
import { arrays } from "@/utils/collections"
import { checkTagName } from "@/utils/check"
import { TOPIC_TYPE_ENUMS, TOPIC_TYPE_ICONS, TOPIC_TYPE_NAMES } from "../define"
import { useTopicContext } from "../inject"
import { useTopicDetailContext } from "./inject"

export default defineComponent({
    setup() {
        const message = useMessageBox()
        const { data, setData, editMode } = useTopicDetailContext()

        const editorData = useMutableComputed<EditorData | null>(() => data.value && ({
            name: data.value.name,
            otherNames: data.value.otherNames,
            type: data.value.type,
            parent: data.value.parent,
            annotations: data.value.annotations,
            keywords: data.value.keywords,
            description: data.value.description,
            links: data.value.links,
            score: data.value.originScore
        }))

        function update<T extends EditorDataProps>(key: T, value: EditorData[T]) {
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
                    score: editorData.value.score !== data.value.score ? editorData.value.score : undefined
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
                        message.showOkMessage("error", "选择的注解不可用。", `选择的注解的导出目标设置使其无法导出至当前主题类型。错误项: ${id}`)
                    }else if(e.code === "RECURSIVE_PARENT") {
                        message.showOkMessage("prompt", "无法应用此父主题。", "此父主题与当前主题存在闭环。")
                    }else if(e.code === "ILLEGAL_CONSTRAINT") {
                        message.showOkMessage("prompt", "无法应用父主题或类型。", "当前主题与父主题的类型不能兼容。考虑更改父主题，或更改当前主题的类型。")
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
            default: () => editorData.value ? <Panel data={editorData.value} onUpdate={update}/> : <div/>
        }}/>
    }
})

const TopBarContent = defineComponent({
    emits: ["save"],
    setup(_, { emit }) {
        const { closePane } = useTopicContext()
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

const Panel = defineComponent({
    props: {
        data: {type: Object as PropType<EditorData>, required: true}
    },
    emits: {
        update<T extends EditorDataProps>(_: T, __: EditorData[T]) { return true }
    },
    setup(props, { emit }) {
        const setName = (v: string) => emit("update", "name", v)
        const setOtherNames = (v: string[]) => emit("update", "otherNames", v)
        const setType = (v: TopicType) => emit("update", "type", v)
        const setKeywords = (v: string) => {
            const s = v.trim()
            const keywords = s ? s.split(/\s+/) : []
            emit("update", "keywords", keywords)
        }
        const setDescription = (v: string) => emit("update", "description", v)
        const setLinks = (v: Link[]) => emit("update", "links", v)
        const setScore = (v: number | null) => emit("update", "score", v)

        const annotationTarget: Ref<AnnotationTarget> = computed(() => props.data.type === "UNKNOWN" ? "TOPIC" : props.data.type)

        return () => <div class="container p-2">
            <div class="box mb-1">
                <div class="mt-2">
                    <span class="label">主题名称</span>
                    <Input class="is-fullwidth" value={props.data.name} onUpdateValue={setName}/>
                </div>
                <div class="flex mt-2">
                    <div class="is-width-60">
                        <span class="label">别名</span>
                        <OtherNameEditor value={props.data.otherNames} onUpdateValue={setOtherNames}/>
                    </div>
                </div>
                <div class="flex mt-2">
                    <div class="mr-3">
                        <span class="label">类型</span>
                        <span class="icon is-line-height-std mx-1">{TYPE_ICON_ELEMENTS[props.data.type]}</span>
                        <Select value={props.data.type} onUpdateValue={setType} items={TYPE_SELECT_ITEMS}/>
                    </div>
                    <div>
                        <span class="label">父主题</span>
                        <span class="is-line-height-small mr-1">
                            <span class="tag">父主题</span>
                        </span>
                        <button class="square button is-white is-small"><span class="icon"><i class="fa fa-times"/></span></button>
                    </div>
                </div>
                <div class="mt-2">
                    <span class="label">手动评分</span>
                    <StarlightEditor value={props.data.score} onUpdateValue={setScore}/>
                    <p class="has-text-grey is-size-small">手动编辑的评分会优先作为主题的评分。在手动评分缺省时使用来自项目的平均分。</p>
                </div>
                <div class="mt-2">
                    <span class="label">注解</span>
                    <AnnotationEditor target={annotationTarget.value} value={props.data.annotations}/>
                </div>
                <div class="mt-2">
                    <span class="label">描述关键字</span>
                    <Input class="is-fullwidth" value={props.data.keywords.join(" ")} onUpdateValue={setKeywords}/>
                </div>
                <div class="mt-2">
                    <span class="label">简介</span>
                    <Textarea class="is-fullwidth" value={props.data.description} onUpdateValue={setDescription}/>
                </div>
            </div>
            <div class="box">
                <span class="label">相关链接</span>
                <LinkEditor value={props.data.links} onUpdateValue={setLinks}/>
            </div>
        </div>
    }
})

const TYPE_SELECT_ITEMS: SelectItem[] =
    Object.entries(TOPIC_TYPE_NAMES).map(([value, name]) => ({name, value}))

const TYPE_ICON_ELEMENTS: {[type in TopicType]: JSX.Element} =
    arrays.toMap(TOPIC_TYPE_ENUMS, type => <i class={`fa fa-${TOPIC_TYPE_ICONS[type]} mr-1`}/>)

interface EditorData {
    name: string
    otherNames: string[]
    type: TopicType
    parent: ParentTopic | null
    annotations: SimpleAnnotation[]
    keywords: string[]
    description: string
    links: Link[]
    score: number | null
}

type EditorDataProps = keyof EditorData
