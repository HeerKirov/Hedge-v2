import { computed, defineComponent } from "vue"
import { Tagme } from "@/functions/adapter-http/impl/illust"
import CheckBox from "@/components/forms/CheckBox"
import LeftColumn from "./LeftColumn"
import RightColumn from "./RightColumn"
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
    - 最近使用。根据上一个项目/最近几个项目/最近使用频次较高的标签/标签历史记录，给出推荐列表。
    - 相关推荐。根据相关项(collection/associate/album关联)，给出推荐列表。
    - 来源推导。根据source tag，推导出可能需要的tag。这个页面也需要能显示source tag列表。
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
