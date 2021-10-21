import { defineComponent, PropType } from "vue"
import { useMetaTagCallout } from "@/layouts/data/MetaTagCallout"
import { SimpleMetaTagElement } from "@/layouts/elements"
import { MetaTagTypeValues } from "@/functions/adapter-http/impl/all"
import { useDroppable } from "@/functions/feature/drag"
import { usePanelContext } from "./inject"
import style from "./style.module.scss"

export default defineComponent({
    setup() {
        const { editorData } = usePanelContext()

        const { isDragover: _, ...dropEvents } = useDroppable(["tag", "topic", "author"], (value, type) => editorData.add(type, value))

        return () => <div class={style.leftColumn} {...dropEvents}>
            <div class={style.tagList}>
                <AuthorItems/>
                <TopicItems/>
                <TagItems/>
                <ExportedItems/>
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
            <EditorItem key={author.id} value={{type: "author", value: author}} showCloseButton={true}
                        onClose={() => editorData.removeAt("author", i)}/>
        )) : undefined
    }
})

const TopicItems = defineComponent({
    setup() {
        const { typeFilter, editorData } = usePanelContext()

        return () => typeFilter.value.topic ? editorData.topics.value.map((topic, i) => (
            <EditorItem key={topic.id} value={{type: "topic", value: topic}} showCloseButton={true}
                        onClose={() => editorData.removeAt("topic", i)}/>
        )) : undefined
    }
})

const TagItems = defineComponent({
    setup() {
        const { typeFilter, editorData } = usePanelContext()

        return () => typeFilter.value.tag ? editorData.tags.value.map((tag, i) => (
            <EditorItem key={tag.id} value={{type: "tag", value: tag}} showCloseButton={true}
                        onClose={() => editorData.removeAt("tag", i)}/>
        )) : undefined
    }
})

const ExportedItems = defineComponent({
    setup() {
        const { editorData: { validation: { exportedResults } } } = usePanelContext()

        return () => (exportedResults.value.tags.length > 0 
        || exportedResults.value.topics.length > 0 
        || exportedResults.value.authors.length > 0) && <>
            <label class="label">导出项</label>
            {exportedResults.value.authors.map(author => <EditorItem key={`author-${author.id}`} value={{type: "author", value: author}}/>)}
            {exportedResults.value.topics.map(topic => <EditorItem key={`topic-${topic.id}`} value={{type: "topic", value: topic}}/>)}
            {exportedResults.value.tags.map(tag => <EditorItem key={`tag-${tag.id}`} value={{type: "tag", value: tag}}/>)}
        </>
    }
})

const EditorItem = defineComponent({
    props: {
        value: {type: Object as PropType<MetaTagTypeValues>, required: true},
        showCloseButton: Boolean
    },
    emits: {
        close: () => true
    },
    setup(props, { emit }) {
        const metaTagCallout = useMetaTagCallout()

        const click = (e: MouseEvent) => {
            metaTagCallout.open((e.currentTarget as Element).getBoundingClientRect(), props.value.type, props.value.value.id)
        }

        return props.showCloseButton ? () => <SimpleMetaTagElement class={style.tagItem} {...props.value} wrappedByDiv={true} onClick={click} v-slots={{
            backOfWrap: () => <a class={["tag", `is-${props.value.value.color}`, style.closeButton]} onClick={() => emit("close")}><i class="fa fa-times"/></a>
        }}/> : () => <SimpleMetaTagElement class={style.tagItem} {...props.value} wrappedByDiv={true} onClick={click}/>
    }
})

const ValidationResult = defineComponent({
    setup() {
        const { editorData: { validation: { validationResults } } } = usePanelContext()

        return () => validationResults.value && <div class={style.notificationList}>
            {validationResults.value.notSuitable.map(item => <div class="mb-1">
                <i class="fa fa-exclamation has-text-danger mr-1"/>
                标签
                <span class={`tag is-${item.color} is-light mx-1`}>{item.name}</span>
                不能被用作关联对象，它的类型是地址段。
            </div>)}
            {validationResults.value.forceConflictingMembers.map(item => <div class="mb-1">
                <i class="fa fa-exclamation has-text-danger mr-1"/>
                <span class="mr-1">标签</span>
                {item.members.map(member => <span class={`tag is-${member.color} mr-1`}>{member.name}</span>)}
                不能被同时应用于一个项目，它们隶属同一个强制冲突组<span class={`tag is-${item.group.color} mr-1`}>{item.group.name}</span>。
            </div>)}
            {validationResults.value.conflictingMembers.map(item => <div class="mb-1">
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
