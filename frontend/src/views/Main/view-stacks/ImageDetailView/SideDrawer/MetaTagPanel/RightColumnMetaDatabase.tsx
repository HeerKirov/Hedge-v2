import { computed, defineComponent, onMounted, PropType, reactive, toRef, watch } from "vue"
import Input from "@/components/forms/Input"
import { AuthorType } from "@/functions/adapter-http/impl/author"
import { TopicType } from "@/functions/adapter-http/impl/topic"
import { AUTHOR_TYPE_ICONS } from "@/definitions/author"
import { TOPIC_TYPE_ICONS } from "@/definitions/topic"
import { useDraggable } from "@/functions/drag"
import { useMetaDatabaseAuthorData, useMetaDatabaseTopicData, usePanelContext } from "./inject"
import style from "./style.module.scss"

export default defineComponent({
    setup() {
        const { rightColumnData: { tabDbType }} = usePanelContext()

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
                <Input class="is-small is-width-medium mb-1" placeholder="搜索项目" value={searchBox[tabDbType.value]} onUpdateValue={updateSearchBox}/>
            </div>
            {tabDbType.value === "author"
                ? <AuthorTab search={searchBox.author}/>
            : tabDbType.value === "topic"
                ? <TopicTab search={searchBox.topic}/>
            : //tag
                <TagTab search={searchBox.tag}/>
            }
        </>
    }
})

const AuthorTab = defineComponent({
    props: {
        search: {type: String, required: true}
    },
    setup(props) {
        const search = toRef(props, "search")
        const authorData = useMetaDatabaseAuthorData(search)
        const showMore = computed(() => !authorData.loading.value && authorData.data.value.total > authorData.data.value.result.length)

        onMounted(() => authorData.refresh())
        watch(search, () => authorData.refresh())

        return () => <div class={[style.metaDatabase, style.author]}>
            {authorData.data.value.result.map(item => <AuthorSelectorItem id={item.id} name={item.name} color={item.color} type={item.type}/>)}
            {showMore.value && <button class="button is-small is-white mt-1" onClick={authorData.next}>加载更多…</button>}
        </div>
    }
})

const TopicTab = defineComponent({
    props: {
        search: {type: String, required: true}
    },
    setup(props) {
        const search = toRef(props, "search")
        const topicData = useMetaDatabaseTopicData(search)
        const showMore = computed(() => !topicData.loading.value && topicData.data.value.total > topicData.data.value.result.length)

        onMounted(() => topicData.refresh())
        watch(search, () => topicData.refresh())

        return () => <div class={[style.metaDatabase, style.topic]}>
            {topicData.data.value.result.map(item => <TopicSelectorItem key={item.id} id={item.id} name={item.name} color={item.color} type={item.type}/>)}
            {showMore.value && <button class="button is-small is-white mt-1" onClick={topicData.next}>加载更多…</button>}
        </div>
    }
})

const TagTab = defineComponent({
    props: {
        search: {type: String, required: true}
    },
    setup() {
        return () => undefined
    }
})

const AuthorSelectorItem = defineComponent({
    props: {
        id: {type: Number, required: true},
        name: {type: String, required: true},
        color: {type: null as any as PropType<string | null>, required: true},
        type: {type: String as PropType<AuthorType>, required: true}
    },
    setup(props) {
        const dragEvents = useDraggable("author", computed(() => ({
            id: props.id,
            name: props.name,
            color: props.color,
            type: props.type
        })))

        return () => <div class={style.tagItem}>
            <span class={`tag is-${props.color}`} draggable={true} {...dragEvents}>
                {props.type && <i class={`fa fa-${AUTHOR_TYPE_ICONS[props.type]} mr-1`}/>}
                {props.name}
            </span>
        </div>
    }
})

const TopicSelectorItem = defineComponent({
    props: {
        id: {type: Number, required: true},
        name: {type: String, required: true},
        color: {type: null as any as PropType<string | null>, required: true},
        type: {type: String as PropType<TopicType>, required: true}
    },
    setup(props) {
        const dragEvents = useDraggable("topic", computed(() => ({
            id: props.id,
            name: props.name,
            color: props.color,
            type: props.type
        })))

        return () => <div class={style.tagItem}>
            <span class={`tag is-${props.color}`} draggable={true} {...dragEvents}>
                {props.type && <i class={`fa fa-${TOPIC_TYPE_ICONS[props.type]} mr-1`}/>}
                {props.name}
            </span>
        </div>
    }
})

