import { computed, defineComponent, PropType, reactive, ref, watch, ComponentPublicInstance } from "vue"
import Input from "@/components/forms/Input"
import { useMetaTagCallout } from "@/layouts/globals/MetaTagCallout"
import { SimpleMetaTagElement, TagAddressElement } from "@/layouts/elements"
import { AuthorType } from "@/functions/adapter-http/impl/author"
import { TopicType } from "@/functions/adapter-http/impl/topic"
import { NodeList, useTagTreeAccessor } from "@/layouts/data/TagTree"
import { useTagListContext, useSearchService, TagAddress } from "@/services/api/tag-tree"
import { useMetaDatabaseAuthorData, useMetaDatabaseTopicData, usePanelContext } from "./inject"
import style from "./style.module.scss"

export default defineComponent({
    setup() {
        const { rightColumnData: { tabDbType }} = usePanelContext()

        const searchBoxFocus = ref(false)
        const searchBox = reactive({author: "", topic: "", tag: ""})
        const updateSearchBox = (value: string) => searchBox[tabDbType.value] = value.trim()

        const tabRef = ref<ComponentPublicInstance>()
        const refresh = () => {
            //向tab组件发出刷新指令
            if(tabRef.value) {
                tabRef.value["refresh"]()
            }
        }

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
                <Input class="is-small is-width-medium mr-1 mb-1" placeholder="搜索项目"
                       value={searchBox[tabDbType.value]} onUpdateValue={updateSearchBox}
                       onfocus={() => searchBoxFocus.value = true} onblur={() => searchBoxFocus.value = false}/>
                <button class="button is-small is-white has-text-link mb-1" onClick={refresh}>
                    <span class="icon"><i class="fa fa-sync-alt"/></span>
                </button>
            </div>
            {tabDbType.value === "author"
                ? <AuthorTab ref={tabRef} search={searchBox.author}/>
            : tabDbType.value === "topic"
                ? <TopicTab ref={tabRef} search={searchBox.topic}/>
            : //tag
                <TagTab ref={tabRef} search={searchBox.tag} searchFocus={searchBoxFocus.value}/>
            }
        </>
    }
})

const AuthorTab = defineComponent({
    props: {
        search: {type: String, required: true}
    },
    setup(props, { expose }) {
        const { data, search } = useMetaDatabaseAuthorData()
        const showMore = computed(() => !data.loading.value && data.data.value.total > data.data.value.result.length)

        watch(() => props.search, s => search.value = s, {immediate: true})

        expose({
            refresh() {
                data.refresh()
            }
        })

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
    setup(props, { expose }) {
        const { data, search } = useMetaDatabaseTopicData()
        const showMore = computed(() => !data.loading.value && data.data.value.total > data.data.value.result.length)

        watch(() => props.search, s => search.value = s, {immediate: true})

        expose({
            refresh() {
                data.refresh()
            }
        })

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
    setup(props, { expose }) {
        const { loading, data, refresh } = useTagListContext()

        const { searchText } = useSearchService()
        const showSearchPanel = ref(false)
        watch(() => props.searchFocus, focus => {
            if(focus && searchText.value) {
                showSearchPanel.value = true
            }
        })
        watch(() => props.search, search => {
            if(search) {
                searchText.value = search
                showSearchPanel.value = true
            }else{
                searchText.value = null
                showSearchPanel.value = false
            }
        })

        expose({
            refresh() {
                refresh()
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
        const { scrollIntoView } = useTagTreeAccessor()
        const { result } = useSearchService()

        const onClick = (id: number) => () => {
            scrollIntoView(id)
            emit("close")
        }

        return () => <div class={style.searchPanel}>
            {result.value.map(item => <TagTabSearchPanelItem key={item.id} node={item} onClick={onClick(item.id)}/>)}
        </div>
    }
})

const TagTabSearchPanelItem = defineComponent({
    props: {
        node: {type: Object as PropType<TagAddress>, required: true}
    },
    emits: ["click"],
    setup(props, { emit }) {
        const click = () => emit("click")

        return () => <div class={style.searchItem}>
            <TagAddressElement address={props.node} clickable={true} draggable={true} onClick={click}/>
        </div>
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
        const metaTagCallout = useMetaTagCallout()
        const click = (e: MouseEvent) => metaTagCallout.open((e.currentTarget as Element).getBoundingClientRect(), "author", props.id)

        return () => <div class={style.tagItem}>
            <SimpleMetaTagElement type="author" value={data.value} draggable={true} onClick={click}/>
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
        const metaTagCallout = useMetaTagCallout()
        const click = (e: MouseEvent) => metaTagCallout.open((e.currentTarget as Element).getBoundingClientRect(), "topic", props.id)

        return () => <div class={style.tagItem}>
            <SimpleMetaTagElement type="topic" value={data.value} draggable={true} onClick={click}/>
        </div>
    }
})
