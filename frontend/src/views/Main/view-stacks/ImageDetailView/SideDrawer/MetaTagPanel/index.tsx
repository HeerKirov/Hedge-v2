import { defineComponent, PropType } from "vue"
import { TopicType } from "@/functions/adapter-http/impl/topic"
import { AuthorType } from "@/functions/adapter-http/impl/author"
import { AUTHOR_TYPE_ICONS } from "@/definitions/author"
import { TOPIC_TYPE_ICONS } from "@/definitions/topic"
import RightColumnMetaDatabase from "./RightColumnMetaDatabase"
import RightColumnSuggest from "./RightColumnSuggest"
import RightColumnSourceDerive from "./RightColumnSourceDerive"
import { installPanelContext, usePanelContext } from "./inject"
import style from "./style.module.scss"

export default defineComponent({
    setup() {
        installPanelContext()

        return () => <div class={style.panelOfMetaTag}>
            <TopColumn/>
            <LeftColumn/>
            <RightColumn/>
            <div class={style.midGap}/>
        </div>
    }
})

/* TODO tag editor内容清单
    tag编辑器采用双栏+多tab+多选项的基本布局模式。
    页面主要内容分为左右两栏，左侧为selected list，右侧提供可选择项。左栏tag都带close按钮，可以直接删掉；右侧点击就会加入selected。
    tag/author/topic在上方划分为多选options，勾选不同的分类在selected list以及右侧显示不同种类的tag。
    - 右侧只有元数据库是豁免的，它总是只显示一类，而如果勾选了多类，就在右侧再出现一层tab。
    - tagme也在顶栏附近作为一个可编辑的选项。
    确认保存的按钮放在右下角，要比较突出地标示出来。
    最后的重点是可选择项区域的可用内容。如果只为tag编辑器提供来自元数据的查询或列表的话那易用性实在不好，因此需要提供多种可选内容使用。
    - 元数据库。提供列表(或标签树)，以及查询机制，就像主页的元数据查询页一样。是完全体的选择。
    - 推荐。根据相关项(collection/associate/album关联)、最近编辑过的项目，给出推荐列表。
    - 推导。根据source tag，推导出可能需要的tag。这个页面也需要能显示source tag列表。
 */

const TopColumn = defineComponent({
    setup() {
        const { typeFilter, rightColumnData: { tab, tabDbType } } = usePanelContext()

        const clickAuthor = () => {
            if(typeFilter.value.author && !typeFilter.value.tag && !typeFilter.value.topic) {
                typeFilter.value = {author: true, tag: true, topic: true}
            }else{
                typeFilter.value = {author: true, tag: false, topic: false}
                if(tab.value === "db") tabDbType.value = "author"
            }
        }
        const clickTopic = () => {
            if(!typeFilter.value.author && !typeFilter.value.tag && typeFilter.value.topic) {
                typeFilter.value = {author: true, tag: true, topic: true}
            }else{
                typeFilter.value = {author: false, tag: false, topic: true}
                if(tab.value === "db") tabDbType.value = "topic"
            }
        }
        const clickTag = () => {
            if(!typeFilter.value.author && typeFilter.value.tag && !typeFilter.value.topic) {
                typeFilter.value = {author: true, tag: true, topic: true}
            }else{
                typeFilter.value = {author: false, tag: true, topic: false}
                if(tab.value === "db") tabDbType.value = "tag"
            }
        }
        const rightClickAuthor = () => {
            typeFilter.value.author = !typeFilter.value.author
        }
        const rightClickTopic = () => {
            typeFilter.value.topic = !typeFilter.value.topic
        }
        const rightClickTag = () => {
            typeFilter.value.tag = !typeFilter.value.tag
        }

        return () => <div class={style.top}>
            <button class={`button is-white has-text-${typeFilter.value.author ? "link" : "grey"} mr-1`} onClick={clickAuthor} onContextmenu={rightClickAuthor}>
                <span class="icon"><i class="fa fa-user-tag"/></span>
                <span>作者</span>
            </button>
            <button class={`button is-white has-text-${typeFilter.value.topic ? "link" : "grey"} mr-1`} onClick={clickTopic} onContextmenu={rightClickTopic}>
                <span class="icon"><i class="fa fa-hashtag"/></span>
                <span>主题</span>
            </button>
            <button class={`button is-white has-text-${typeFilter.value.tag ? "link" : "grey"} mr-1`} onClick={clickTag} onContextmenu={rightClickTag}>
                <span class="icon"><i class="fa fa-tag"/></span>
                <span>标签</span>
            </button>
        </div>
    }
})

const LeftColumn = defineComponent({
    setup() {
        const { typeFilter, editorData } = usePanelContext()

        return () => <div class={style.leftColumn}>
            {typeFilter.value.author && editorData.authors.value.map((author, i) => <MetaTagEditorItem key={`author-${author.id}`} name={author.name} color={author.color} type={author.type} onClose={() => editorData.removeAt("author", i)}/>)}
            {typeFilter.value.topic && editorData.topics.value.map((topic, i) => <MetaTagEditorItem key={`topic-${topic.id}`} name={topic.name} color={topic.color} type={topic.type} onClose={() => editorData.removeAt("topic", i)}/>)}
            {typeFilter.value.tag && editorData.tags.value.map((tag, i) => <MetaTagEditorItem key={`tag-${tag.id}`} name={tag.name} color={tag.color} onClose={() => editorData.removeAt("tag", i)}/>)}
        </div>
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

const RightColumn = defineComponent({
    setup() {
        const { rightColumnData: { tab }} = usePanelContext()

        return () => <div class={style.rightColumn}>
            <div class="m-1">
                <button class={`button is-${tab.value === "db" ? "link" : "white"} mr-1`} onClick={() => tab.value = "db"}>
                    <span class="icon"><i class="fa fa-database"/></span>
                    <span>元数据库</span>
                </button>
                <button class={`button is-${tab.value === "suggest" ? "link" : "white"} mr-1`} onClick={() => tab.value = "suggest"}>
                    <span class="icon"><i class="fa fa-adjust"/></span>
                    <span>建议项目</span>
                </button>
                <button class={`button is-${tab.value === "source" ? "link" : "white"}`} onClick={() => tab.value = "source"}>
                    <span class="icon"><i class="fa fa-file-invoice"/></span>
                    <span>来源推导</span>
                </button>
            </div>
            {tab.value === "db"
                ? <RightColumnMetaDatabase/>
            : tab.value === "suggest"
                ? <RightColumnSuggest/>
            : //source
                <RightColumnSourceDerive/>
            }
        </div>
    }
})
