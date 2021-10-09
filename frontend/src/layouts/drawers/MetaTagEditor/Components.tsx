import { defineComponent, PropType, ref } from "vue"
import CheckBox from "@/components/forms/CheckBox"
import { SimpleTopic } from "@/functions/adapter-http/impl/topic"
import { SimpleAuthor } from "@/functions/adapter-http/impl/author"
import { SimpleTag } from "@/functions/adapter-http/impl/tag"
import { MetaTagTypes, MetaTagTypeValues, MetaTagValues } from "@/functions/adapter-http/impl/all"
import { SimpleMetaTagElement } from "@/layouts/elements"
import { useMetaTagCallout } from "@/layouts/data/MetaTagCallout"
import { usePanelContext } from "./inject"
import style from "./style.module.scss"

export const MetaTagSelectList = defineComponent({
    props: {
        topics: {type: Array as PropType<SimpleTopic[]>, required: true},
        authors: {type: Array as PropType<SimpleAuthor[]>, required: true},
        tags: {type: Array as PropType<SimpleTag[]>, required: true}
    },
    setup(props) {
        const { typeFilter } = usePanelContext()

        const { selectedAuthors, selectedTopics, selectedTags, selectAll, selectReverse, addAll } = useSelectListContext(props)

        return () => <>
            <div class={style.suggest}>
                {typeFilter.value.author && props.authors.map(author => <MetaTagSelectItem key={`author-${author.id}`} type="author" value={author}
                                                                                           selected={selectedAuthors.value[author.id]}
                                                                                           onUpdateSelected={v => selectedAuthors.value[author.id] = v}/>)}
                {typeFilter.value.topic && props.topics.map(topic => <MetaTagSelectItem key={`topic-${topic.id}`} type="topic" value={topic}
                                                                                        selected={selectedTopics.value[topic.id]}
                                                                                        onUpdateSelected={v => selectedTopics.value[topic.id] = v}/>)}
                {typeFilter.value.tag && props.tags.map(tag => <MetaTagSelectItem key={`tag-${tag.id}`} type="tag" value={tag}
                                                                                  selected={selectedTags.value[tag.id]}
                                                                                  onUpdateSelected={v => selectedTags.value[tag.id] = v}/>)}
            </div>
            <div class={style.toolBar}>
                <button class="button is-white has-text-link" onClick={selectAll}>
                    <span class="icon"><i class="fa fa-check-square"/></span><span>全选</span>
                </button>
                <button class="button is-white has-text-link" onClick={selectReverse}>
                    <span class="icon"><i class="far fa-check-square"/></span><span>反选</span>
                </button>
                <button class="button is-link float-right" onClick={addAll}>
                    <span class="icon"><i class="fa fa-save"/></span><span>添加所选项</span>
                </button>
            </div>
        </>
    }
})

const MetaTagSelectItem = defineComponent({
    props: {
        type: {type: String as PropType<MetaTagTypes>, required: true},
        value: {type: Object as PropType<MetaTagValues>, required: true},
        selected: {type: Boolean, default: true}
    },
    emits: {
        updateSelected: (_: boolean) => true
    },
    setup(props, { emit }) {
        const metaTagCallout = useMetaTagCallout()
        const click = (e: MouseEvent) => metaTagCallout.open((e.currentTarget as Element).getBoundingClientRect(), props.type, props.value.id)

        return () => <div class={style.tagItem}>
            <CheckBox value={props.selected} onUpdateValue={v => emit("updateSelected", v)}/>
            <SimpleMetaTagElement type={props.type} value={props.value} draggable={true} onClick={click}/>
        </div>
    }
})

function useSelectListContext(props: {tags: SimpleTag[], topics: SimpleTopic[], authors: SimpleAuthor[]}) {
    const { typeFilter, editorData } = usePanelContext()

    const selectedAuthors = ref<Record<number, boolean>>({})
    const selectedTopics = ref<Record<number, boolean>>({})
    const selectedTags = ref<Record<number, boolean>>({})

    const selectAll = () => {
        if(typeFilter.value.tag) selectedTags.value = {}
        if(typeFilter.value.author) selectedAuthors.value = {}
        if(typeFilter.value.topic) selectedTopics.value = {}
    }

    const selectNone = () => {
        if(typeFilter.value.tag) for (const tag of props.tags) {
            selectedTags.value[tag.id] = false
        }
        if(typeFilter.value.topic) for (const topic of props.topics) {
            selectedTopics.value[topic.id] = false
        }
        if(typeFilter.value.author) for (const author of props.authors) {
            selectedAuthors.value[author.id] = false
        }
    }

    const selectReverse = () => {
        if(typeFilter.value.tag) for (const tag of props.tags) {
            if(selectedTags.value[tag.id] === false) {
                delete selectedTags.value[tag.id]
            }else{
                selectedTags.value[tag.id] = false
            }
        }
        if(typeFilter.value.topic) for (const topic of props.topics) {
            if(selectedTopics.value[topic.id] === false) {
                delete selectedTopics.value[topic.id]
            }else{
                selectedTopics.value[topic.id] = false
            }
        }
        if(typeFilter.value.author) for (const author of props.authors) {
            if(selectedAuthors.value[author.id] === false) {
                delete selectedAuthors.value[author.id]
            }else{
                selectedAuthors.value[author.id] = false
            }
        }
    }

    const addAll = () => {
        const addList: MetaTagTypeValues[] = []
        if(typeFilter.value.author) for (const author of props.authors) {
            if(selectedAuthors.value[author.id] !== false) addList.push({type: "author", value: author})
        }
        if(typeFilter.value.topic) for (const topic of props.topics) {
            if(selectedTopics.value[topic.id] !== false) addList.push({type: "topic", value: topic})
        }
        if(typeFilter.value.tag) for (const tag of props.tags) {
            if(selectedTags.value[tag.id] !== false) addList.push({type: "tag", value: tag})
        }
        if(addList.length) {
            editorData.addAll(addList)
            selectNone()
        }
    }

    return {selectedAuthors, selectedTopics, selectedTags, selectAll, selectReverse, addAll}
}
