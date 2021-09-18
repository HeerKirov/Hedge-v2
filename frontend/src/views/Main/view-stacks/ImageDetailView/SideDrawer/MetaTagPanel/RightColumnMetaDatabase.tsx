import { computed, defineComponent, PropType, reactive, ref, watch } from "vue"
import Input from "@/components/forms/Input"
import { MetaTagElement } from "@/layouts/display-components"
import { AuthorType } from "@/functions/adapter-http/impl/author"
import { TopicType } from "@/functions/adapter-http/impl/topic"
import { NodeList } from "@/layouts/data/TagTree"
import { useTagListContext, useSearchService } from "@/functions/api/tag-tree"
import { useMetaDatabaseAuthorData, useMetaDatabaseTopicData, usePanelContext } from "./inject"
import style from "./style.module.scss"

export default defineComponent({
    setup() {
        const { rightColumnData: { tabDbType }} = usePanelContext()

        const searchBoxFocus = ref(false)
        const searchBox = reactive({author: "", topic: "", tag: ""})
        const updateSearchBox = (value: string) => searchBox[tabDbType.value] = value

        return () => <>
            <div class="mx-1">
                <button class={`button is-small is-${tabDbType.value === "author" ? "link" : "white"} mr-1 mb-1`} onClick={() => tabDbType.value = "author"}>
                    <span class="icon"><i class="fa fa-user-tag"/></span>
                    <span>作者</span>
                </button>
                <button class={`button is-small is-${tabDbType.value === "topic" ? "link" : "white"} mr-1 mb-1`} onClick={() => tabDbType.value = "topic"}>
                    <span class="icon"><i class="fa fa-hashtag"/></span>
                    <span>主题</span>
                </button>
                <button class={`button is-small is-${tabDbType.value === "tag" ? "link" : "white"} mr-1 mb-1`} onClick={() => tabDbType.value = "tag"}>
                    <span class="icon"><i class="fa fa-tag"/></span>
                    <span>标签</span>
                </button>
                <Input class="is-small is-width-medium mb-1" placeholder="搜索项目"
                       value={searchBox[tabDbType.value]} onUpdateValue={updateSearchBox}
                       onfocus={() => searchBoxFocus.value = true} onblur={() => searchBoxFocus.value = false}/>
            </div>
            {tabDbType.value === "author"
                ? <AuthorTab search={searchBox.author}/>
            : tabDbType.value === "topic"
                ? <TopicTab search={searchBox.topic}/>
            : //tag
                <TagTab search={searchBox.tag} searchFocus={searchBoxFocus.value}/>
            }
        </>
    }
})

const AuthorTab = defineComponent({
    props: {
        search: {type: String, required: true}
    },
    setup(props) {
        const { data, search } = useMetaDatabaseAuthorData()
        const showMore = computed(() => !data.loading.value && data.data.value.total > data.data.value.result.length)

        watch(() => props.search, s => search.value = s, {immediate: true})

        return () => <div class={[style.metaDatabase, style.author]}>
            {data.data.value.result.map(item => <AuthorItem id={item.id} name={item.name} color={item.color} type={item.type}/>)}
            {showMore.value && <button class="button is-small is-white mt-1" onClick={data.next}>加载更多…</button>}
        </div>
    }
})

const TopicTab = defineComponent({
    props: {
        search: {type: String, required: true}
    },
    setup(props) {
        const { data, search } = useMetaDatabaseTopicData()
        const showMore = computed(() => !data.loading.value && data.data.value.total > data.data.value.result.length)

        watch(() => props.search, s => search.value = s, {immediate: true})

        return () => <div class={[style.metaDatabase, style.topic]}>
            {data.data.value.result.map(item => <TopicItem key={item.id} id={item.id} name={item.name} color={item.color} type={item.type}/>)}
            {showMore.value && <button class="button is-small is-white mt-1" onClick={data.next}>加载更多…</button>}
        </div>
    }
})

const TagTab = defineComponent({
    props: {
        search: {type: String, required: true},
        searchFocus: {type: Boolean, required: true}
    },
    setup(props) {
        const { loading, data } = useTagListContext()

        const showSearchPanel = ref(false)
        watch(() => props.searchFocus, focus => {
            if(focus && props.search) {
                showSearchPanel.value = true
            }
        })
        watch(() => props.search, search => {
            if(search) {
                showSearchPanel.value = true
            }
        })

        return () => <div class={[style.metaDatabase, style.tag]}>
            {loading.value ? null : <NodeList items={data.value} multiLine={true}/>}
            {showSearchPanel.value && <TagTabSearchPanel search={props.search} onClose={() => showSearchPanel.value = false}/>}
        </div>
    }
})

const TagTabSearchPanel = defineComponent({
    props: {
        search: {type: String, required: true}
    },
    emits: ["close"],
    setup(props, { emit }) {
        const { result, searchText } = useSearchService()

        return () => undefined
    }
})

const AuthorItem = defineComponent({
    props: {
        id: {type: Number, required: true},
        name: {type: String, required: true},
        color: {type: null as any as PropType<string | null>, required: true},
        type: {type: String as PropType<AuthorType>, required: true}
    },
    setup(props) {
        const data = computed(() => ({
            id: props.id,
            name: props.name,
            color: props.color,
            type: props.type
        }))

        return () => <div class={style.tagItem}>
            <MetaTagElement type="author" value={data.value} clickable={true} draggable={true}/>
        </div>
    }
})

const TopicItem = defineComponent({
    props: {
        id: {type: Number, required: true},
        name: {type: String, required: true},
        color: {type: null as any as PropType<string | null>, required: true},
        type: {type: String as PropType<TopicType>, required: true}
    },
    setup(props) {
        const data = computed(() => ({
            id: props.id,
            name: props.name,
            color: props.color,
            type: props.type
        }))

        return () => <div class={style.tagItem}>
            <MetaTagElement type="topic" value={data.value} clickable={true} draggable={true}/>
        </div>
    }
})
