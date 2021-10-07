import { computed, defineComponent, PropType, toRef } from "vue"
import CheckBox from "@/components/forms/CheckBox"
import { Tagme } from "@/functions/adapter-http/impl/illust"
import { DepsTag } from "@/functions/adapter-http/impl/tag"
import { DepsTopic } from "@/functions/adapter-http/impl/topic"
import { DepsAuthor } from "@/functions/adapter-http/impl/author"
import { MetaUtilRelatedIdentity } from "@/functions/adapter-http/impl/util-meta"
import LeftColumn from "./LeftColumn"
import RightColumn from "./RightColumn"
import { installPanelContext, usePanelContext, SetData } from "./inject"
import style from "./style.module.scss"

/* TODO tag editor内容清单
    - 最近使用。根据上一个项目/最近几个项目/最近使用频次较高的标签/标签历史记录，给出推荐列表。
    - 来源推导。根据source tag，推导出可能需要的tag。这个页面也需要能显示source tag列表。
   TODO tag editor内容优化清单
    - 显示推导结果：左侧栏在下面跟着显示推导标签，以提示用户最终结果。
    - 校验功能的来源提示：为校验功能添加Link和Exported项的标记提示，告诉用户这些项是哪儿来的，以免摸不着头脑。
    - 标签来源追踪：双击tag会在右侧跳转到此tag的位置。
 */
export default defineComponent({
    props: {
        tags: {type: Array as PropType<DepsTag[]>, required: true},
        topics: {type: Array as PropType<DepsTopic[]>, required: true},
        authors: {type: Array as PropType<DepsAuthor[]>, required: true},
        tagme: {type: Array as PropType<Tagme[]>, required: true},
        setData: {type: Function as PropType<SetData>, required: true},
        identity: {type: null as any as PropType<MetaUtilRelatedIdentity | null>, required: true}
    },
    emits: {
        close: () => true
    },
    setup(props, { emit }) {
        const data = computed(() => ({
            tags: props.tags,
            topics: props.topics,
            authors: props.authors,
            tagme: props.tagme
        }))

        installPanelContext({
            data,
            setData: props.setData,
            close: () => emit("close"),
            identity: toRef(props, "identity")
        })

        return () => <div class={style.panelOfMetaTag}>
            <TopColumn/>
            <LeftColumn/>
            <RightColumn/>
            <div class={style.midGap}/>
        </div>
    }
})

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
            <TagmeEditor/>
        </div>
    }
})

const TagmeEditor = defineComponent({
    setup() {
        const { tagme, setTagme } = usePanelContext().editorData

        const isEnabled = computed<{[key in Tagme]: boolean}>(() => ({
            TAG: tagme.value.includes("TAG"),
            TOPIC: tagme.value.includes("TOPIC"),
            AUTHOR: tagme.value.includes("AUTHOR"),
            SOURCE: tagme.value.includes("SOURCE")
        }))

        const onUpdate = (key: Tagme) => (value: boolean) => {
            if(value) {
                setTagme([...tagme.value, key])
            }else{
                setTagme(tagme.value.filter(v => v !== key))
            }
        }

        return () => <div class={style.tagmeEditor}>
            <span class="has-text-link">Tagme</span>
            <CheckBox class={`has-text-${isEnabled.value.AUTHOR ? "link" : "grey"}`} value={isEnabled.value.AUTHOR} onUpdateValue={onUpdate("AUTHOR")}><i class="fa fa-user-tag mr-1"/>作者</CheckBox>
            <CheckBox class={`has-text-${isEnabled.value.TOPIC ? "link" : "grey"}`} value={isEnabled.value.TOPIC} onUpdateValue={onUpdate("TOPIC")}><i class="fa fa-hashtag mr-1"/>主题</CheckBox>
            <CheckBox class={`has-text-${isEnabled.value.TAG ? "link" : "grey"}`} value={isEnabled.value.TAG} onUpdateValue={onUpdate("TAG")}><i class="fa fa-tag mr-1"/>标签</CheckBox>
            <CheckBox class={`has-text-${isEnabled.value.SOURCE ? "link" : "grey"}`} value={isEnabled.value.SOURCE} onUpdateValue={onUpdate("SOURCE")}><i class="fa fa-pager mr-1"/>来源</CheckBox>
        </div>
    }
})
