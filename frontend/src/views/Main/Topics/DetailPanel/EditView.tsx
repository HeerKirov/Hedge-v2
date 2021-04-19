import { defineComponent, PropType, reactive, ref } from "vue"
import Input from "@/components/forms/Input"
import Textarea from "@/components/forms/Textarea"
import Select, { SelectItem } from "@/components/forms/Select"
import TopBarTransparentLayout from "@/layouts/layouts/TopBarTransparentLayout"
import { Link } from "@/functions/adapter-http/impl/generic"
import { SimpleAnnotation } from "@/functions/adapter-http/impl/annotations"
import { ParentTopic, TopicType } from "@/functions/adapter-http/impl/topic"
import { useMutableComputed } from "@/functions/utils/basic"
import { onKeyEnter } from "@/utils/events"
import { objects } from "@/utils/primitives"
import { arrays } from "@/utils/collections"
import { TOPIC_TYPE_ENUMS, TOPIC_TYPE_ICONS, TOPIC_TYPE_NAMES } from "../define"
import { useTopicContext } from "../inject"
import { useTopicDetailContext } from "./inject"
import style from "./style.module.scss"

export default defineComponent({
    setup() {
        const { data, setData, editMode } = useTopicDetailContext()

        const editorData = useMutableComputed<EditorData | null>(() => data.value && ({
            name: data.value.name,
            otherNames: data.value.otherNames,
            type: data.value.type,
            parent: data.value.parent,
            annotations: data.value.annotations,
            keywords: data.value.keywords,
            description: data.value.description,
            links: data.value.links
        }))

        function update<T extends EditorDataProps>(key: T, value: EditorData[T]) {
            if(editorData.value) {
                editorData.value[key] = value
            }
        }

        const save = async () => {
            //TODO validate
            if(editorData.value && data.value) {
                const r = await setData({
                    name: editorData.value.name !== data.value.name ? editorData.value.name : undefined,
                    otherNames: !objects.deepEquals(editorData.value.otherNames, data.value.otherNames) ? editorData.value.otherNames : undefined,
                    type: editorData.value.type !== data.value.type ? editorData.value.type : undefined,
                    parentId: (editorData.value.parent?.id ?? null) !== (data.value.parent?.id ?? null) ? (editorData.value.parent?.id ?? null) : undefined,
                    annotations: !objects.deepEquals(editorData.value.annotations.map(i => i.id), data.value.annotations.map(i => i.id)) ? editorData.value.annotations.map(i => i.id) : undefined,
                    keywords: !objects.deepEquals(editorData.value.keywords, data.value.keywords) ? editorData.value.keywords : undefined,
                    description: editorData.value.description !== data.value.description ? editorData.value.description : undefined,
                    links: !objects.deepEquals(editorData.value.links, data.value.links) ? editorData.value.links : undefined,
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
                <button class="square button no-drag radius-large is-white" onClick={closePane}>
                    <span class="icon"><i class="fa fa-arrow-left"/></span>
                </button>
            </div>
            <div class="layout-container">
                <button class="square button no-drag radius-large is-white mr-1" onClick={cancel}>
                    <span class="icon"><i class="fa fa-times"/></span>
                </button>
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
                    <span class="label">注解</span>
                    <div class="box multi flex">
                        {props.data.annotations.map(annotation => <span class="tag mr-1">[ {annotation.name} ]</span>)}
                        <a class="tag mr-1 is-light is-success"><i class="fa fa-plus mr-1"/>添加注解</a>
                    </div>
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

const OtherNameEditor = defineComponent({
    props: {
        value: {type: Array as PropType<string[]>, required: true}
    },
    emits: {
        updateValue(_: string[]) { return true }
    },
    setup(props, { emit }) {
        const newValue = (v: string) => {
            const s = v.trim()
            if(s) {
                emit("updateValue", [...props.value, s])
            }
        }

        const onDelete = (i: number) => () => {
            emit("updateValue", [...props.value.slice(0, i), ...props.value.slice(i + 1)])
        }

        return () => <>
            {props.value.map((otherName, i) => <div class="flex mb-1">
                <Input class="is-fullwidth is-small mr-1" value={otherName}/>
                <button class="square button is-white is-small" onClick={onDelete(i)}><span class="icon"><i class="fa fa-times"/></span></button>
            </div>)}
            <div class="flex">
                <OtherNameNewBox onNew={newValue}/>
                <button disabled class="is-hidden square button is-white is-small"><span class="icon"><i class="fa fa-times"/></span></button>
            </div>
        </>
    }
})

const OtherNameNewBox = defineComponent({
    emits: {
        new(_: string) { return true }
    },
    setup(_, { emit }) {
        const newText = ref("")

        const submit = () => {
            const text = newText.value.trim()
            if(text) {
                emit("new", text)
                newText.value = ""
            }
        }

        return () => <Input class="is-fullwidth is-small mr-1" placeholder="添加新的别名"
                            value={newText.value} onUpdateValue={v => newText.value = v} refreshOnInput={true}
                            onBlur={submit} onKeypress={onKeyEnter(submit)}/>
    }
})

const LinkEditor = defineComponent({
    props: {
        value: {type: Array as PropType<Link[]>, required: true}
    },
    emits: {
        updateValue(_: Link[]) { return true }
    },
    setup(props, { emit }) {
        const onDelete = (i: number) => () => {
            emit("updateValue", [...props.value.slice(0, i), ...props.value.slice(i + 1)])
        }

        const newValue = (link: Link) => {
            emit("updateValue", [...props.value, link])
        }

        return () => <>
            {props.value.map((link, i) => <div class="flex mb-1">
                <Input class="is-small is-width-25 mr-1" value={link.title}/>
                <Input class="is-small is-width-75 mr-1" value={link.link}/>
                <button class="square button is-white is-small is-not-shrink is-not-grow" onClick={onDelete(i)}><span class="icon"><i class="fa fa-times"/></span></button>
            </div>)}
            <LinkNewBox onNew={newValue}/>
        </>
    }
})

const LinkNewBox = defineComponent({
    emits: {
        new(_: Link) { return true }
    },
    setup(_, { emit }) {
        const text = reactive<Link>({title: "", link: ""})

        const add = () => {
            const title = text.title.trim(), link = text.link.trim()
            //TODO validate
            if(title && link) {
                emit("new", {title, link})
                text.title = ""
                text.link = ""
            }
        }

        return () => <div class="flex">
            <Input class="is-small is-width-25 mr-1" value={text.title} onUpdateValue={v => text.title = v} refreshOnInput={true} onKeypress={onKeyEnter(add)}/>
            <Input class="is-small is-width-75 mr-1" value={text.link} onUpdateValue={v => text.link = v} refreshOnInput={true} onKeypress={onKeyEnter(add)}/>
            <button class="square button is-white is-small is-not-shrink is-not-grow" onClick={add}><span class="icon"><i class="fa fa-plus"/></span></button>
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
}

type EditorDataProps = keyof EditorData
