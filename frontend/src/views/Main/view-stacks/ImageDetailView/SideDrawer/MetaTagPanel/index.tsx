import { defineComponent } from "vue"
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
    - tagme也在顶栏附近作为一个可编辑的选项。
    最后的重点是可选择项区域的可用内容。如果只为tag编辑器提供来自元数据的查询或列表的话那易用性实在不好，因此需要提供多种可选内容使用。
    - 元数据库。提供列表(或标签树)，以及查询机制，就像主页的元数据查询页一样。是完全体的选择。
    - 最近使用。根据最近编辑过的几个项目，和最近频次较高的历史记录，给出最近使用推荐列表
    - 推荐项目。根据相关项(collection/associate/album关联)，给出推荐列表。
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
        </div>
    }
})
