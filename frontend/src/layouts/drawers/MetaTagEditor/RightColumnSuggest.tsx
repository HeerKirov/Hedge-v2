import { computed, defineComponent, PropType, ref, watch } from "vue"
import Select, { SelectItem } from "@/components/forms/Select"
import CheckBox from "@/components/forms/CheckBox"
import { MetaTagTypes, MetaTagValues, SimpleAuthor, SimpleTopic, SimpleTag, MetaTagTypeValues } from "@/functions/adapter-http/impl/all"
import { SimpleMetaTagElement } from "@/layouts/elements"
import { useHttpClient } from "@/functions/app"
import { useMetaTagCallout } from "@/layouts/data/MetaTagCallout"
import { objects } from "@/utils/primitives"
import { usePanelContext } from "./inject"
import style from "./style.module.scss"

export default defineComponent({
    setup() {
        const { selectList, suggestions } = useSuggestionItems()

        const selectedIndex = ref<number>(0)
        const selectedSuggestion = computed<{topics: SimpleTopic[], authors: SimpleAuthor[], tags: SimpleTag[]} | undefined>(() => suggestions.value[selectedIndex.value])

        return () => <>
            <div class="mx-1">
                <Select class="is-small" items={selectList.value} value={selectList.value[selectedIndex.value]?.value} onUpdateValue={(_, i) => selectedIndex.value = i}/>
            </div>
            <MetaTagSelectList topics={selectedSuggestion.value?.topics ?? []} authors={selectedSuggestion.value?.authors ?? []} tags={selectedSuggestion.value?.tags ?? []}/>
        </>
    }
})

const MetaTagSelectList = defineComponent({
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

function useSuggestionItems() {
    const httpClient = useHttpClient()
    const { identity } = usePanelContext()

    const selectList = ref<SelectItem[]>([])
    const suggestions = ref<{topics: SimpleTopic[], authors: SimpleAuthor[], tags: SimpleTag[]}[]>([])

    watch(identity, async (identity, old) => {
        if(identity !== null) {
            //确认首次执行，或identity实质未变
            if(old === undefined || !objects.deepEquals(identity, old)) {
                const res = await httpClient.metaUtil.suggest(identity)
                if(res.ok) {
                    selectList.value = res.data.map(r => {
                        if(r.type === "children") return {name: "关联的子项目", value: "children"}
                        else if(r.type === "associate") return {name: "关联组的相关项目", value: "associate"}
                        else if(r.type === "collection") return {name: `所属的图库集合 ${r.collectionId}`, value: "collection"}
                        else if(r.type === "album") return {name: `所属画集《${r.album.title}》`, value: `album-${r.album.id}`}
                        else throw Error(`Unsupported suggestion ${r}.`)
                    })
                    suggestions.value = res.data.map(r => ({topics: r.topics, tags: r.tags, authors: r.authors}))
                    return
                }else{
                    selectList.value = []
                    suggestions.value = []
                }
            }
        }else{
            selectList.value = []
            suggestions.value = []
        }
    }, {immediate: true})

    return {selectList, suggestions}
}

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
