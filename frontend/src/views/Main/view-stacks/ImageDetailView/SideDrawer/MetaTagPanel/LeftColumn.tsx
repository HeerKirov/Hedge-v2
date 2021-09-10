import { defineComponent, PropType } from "vue"
import { AuthorType } from "@/functions/adapter-http/impl/author"
import { TopicType } from "@/functions/adapter-http/impl/topic"
import { useDroppable } from "@/functions/drag"
import { AUTHOR_TYPE_ICONS } from "@/definitions/author"
import { TOPIC_TYPE_ICONS } from "@/definitions/topic"
import { usePanelContext } from "./inject"
import style from "./style.module.scss"

export default defineComponent({
    setup() {
        const { editorData } = usePanelContext()

        const { isDragover: _, ...dropEvents } = useDroppable(editorData.add)

        return () => <div class={style.leftColumn} {...dropEvents}>
            <div class={style.tagList}>
                <AuthorItems/>
                <TopicItems/>
                <TagItems/>
            </div>
            <ValidationResult/>
            <ToolBar/>
        </div>
    }
})

const AuthorItems = defineComponent({
    setup() {
        const { typeFilter, editorData } = usePanelContext()

        return () => typeFilter.value.author ? editorData.authors.value.map((author, i) => (
            <MetaTagEditorItem key={author.id} name={author.name} color={author.color} type={author.type}
                               onClose={() => editorData.removeAt("author", i)}/>
        )) : undefined
    }
})

const TopicItems = defineComponent({
    setup() {
        const { typeFilter, editorData } = usePanelContext()

        return () => typeFilter.value.topic ? editorData.topics.value.map((topic, i) => (
            <MetaTagEditorItem key={topic.id} name={topic.name} color={topic.color} type={topic.type}
                               onClose={() => editorData.removeAt("topic", i)}/>
        )) : undefined
    }
})

const TagItems = defineComponent({
    setup() {
        const { typeFilter, editorData } = usePanelContext()

        return () => typeFilter.value.tag ? editorData.tags.value.map((tag, i) => (
            <MetaTagEditorItem key={tag.id} name={tag.name} color={tag.color}
                               onClose={() => editorData.removeAt("tag", i)}/>
        )) : undefined
    }
})

const MetaTagEditorItem = defineComponent({
    props: {
        name: {type: String, required: true},
        color: {type: null as any as PropType<string | null>, required: true},
        type: String as PropType<AuthorType | TopicType>
    },
    emits: ["close"],
    setup(props, { emit }) {
        const close = () => emit("close")

        function findIcon(type: AuthorType | TopicType): string {
            return AUTHOR_TYPE_ICONS[type] ?? TOPIC_TYPE_ICONS[type]
        }

        return () => <div class={style.tagItem}>
            <span class={`tag is-${props.color}`}>
                {props.type && <i class={`fa fa-${findIcon(props.type)} mr-1`}/>}
                {props.name}
                <a class="has-text-white ml-2" onClick={close}><i class="fa fa-times"/></a>
            </span>
        </div>
    }
})

const ValidationResult = defineComponent({
    setup() {
        const { editorData: { validation: { tagValidationResults } } } = usePanelContext()

        return () => tagValidationResults.value && <div class={style.notificationList}>
            {tagValidationResults.value.notSuitable.map(item => <div class="mb-1">
                <i class="fa fa-exclamation has-text-danger mr-1"/>
                标签
                <span class={`tag is-${item.color} is-light mx-1`}>{item.name}</span>
                不能被用作关联对象，它的类型是地址段。
            </div>)}
            {tagValidationResults.value.forceConflictingMembers.map(item => <div class="mb-1">
                <i class="fa fa-exclamation has-text-danger mr-1"/>
                <span class="mr-1">标签</span>
                {item.members.map(member => <span class={`tag is-${member.color} mr-1`}>{member.name}</span>)}
                不能被同时应用于一个项目，它们隶属同一个强制冲突组<span class={`tag is-${item.group.color} mr-1`}>{item.group.name}</span>。
            </div>)}
            {tagValidationResults.value.conflictingMembers.map(item => <div class="mb-1">
                <i class="fa fa-exclamation has-text-warning mr-1"/>
                <span class="mr-1">标签</span>
                {item.members.map(member => <span class={`tag is-${member.color} mr-1`}>{member.name}</span>)}
                不建议同时应用于一个项目，它们隶属同一个冲突组<span class={`tag is-${item.group.color} mr-1`}>{item.group.name}</span>。
            </div>)}
        </div>
    }
})

const ToolBar = defineComponent({
    setup() {
        const { editorData: { history, canSave, save } } = usePanelContext()

        return () => <div class={style.toolBar}>
            <button class={`button is-white has-text-${history.canUndo.value ? "link" : "grey"}`} disabled={!history.canUndo.value} onClick={history.undo}>
                <span class="icon"><i class="fa fa-undo"/></span><span>撤销</span>
            </button>
            <button class={`button is-white has-text-${history.canRedo.value ? "link" : "grey"}`} disabled={!history.canRedo.value} onClick={history.redo}>
                <span class="icon"><i class="fa fa-redo"/></span><span>重做</span>
            </button>
            <button class="button is-link float-right" disabled={!canSave.value} onClick={save}>
                <span class="icon"><i class="fa fa-save"/></span><span>保存</span>
            </button>
        </div>
    }
})
