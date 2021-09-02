import { defineComponent, PropType } from "vue"
import { SimpleTag } from "@/functions/adapter-http/impl/tag"
import { AuthorType, SimpleAuthor } from "@/functions/adapter-http/impl/author"
import { SimpleTopic, TopicType } from "@/functions/adapter-http/impl/topic"
import { useDroppable } from "@/functions/drag"
import { AUTHOR_TYPE_ICONS } from "@/definitions/author"
import { TOPIC_TYPE_ICONS } from "@/definitions/topic"
import { usePanelContext } from "./inject"
import style from "./style.module.scss"

export default defineComponent({
    setup() {
        const { editorData: { authors, tags, topics } } = usePanelContext()

        //TODO tags在列表中时需要几项验证: 类型不能为addr; 相同冲突组标签不能同时存在(警告或错误)。
        //      这个行为需要在inject中完成。为了完成这些验证，需要依赖一颗完整的标签树。
        //      标签树，加上接下来的标签浏览器，可能与tag list中的内容有大量可复用代码，尝试抽象。

        const { isDragover: _, ...dropEvents } = useDroppable((type, data) => {
            //拖放标签时，加入此标签
            if(type === "tag") {
                const tag = data as SimpleTag
                if(!tags.value.find(i => i.id === tag.id)) {
                    tags.value.splice(tags.value.length, 0, tag)
                }
            }else if(type === "author") {
                const author = data as SimpleAuthor
                if(!authors.value.find(i => i.id === author.id)) {
                    authors.value.splice(authors.value.length, 0, author)
                }
            }else if(type === "topic") {
                const topic = data as SimpleTopic
                if(!topics.value.find(i => i.id === topic.id)) {
                    topics.value.splice(topics.value.length, 0, topic)
                }
            }
        })

        return () => <div class={style.leftColumn} {...dropEvents}>
            <AuthorItems/>
            <TopicItems/>
            <TagItems/>
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
