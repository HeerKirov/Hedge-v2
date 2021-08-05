import { defineComponent } from "vue"
import style from "./style.module.scss"

export default defineComponent({
    setup() {
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
    props: {

    },
    emits: [],
    setup(props, { emit }) {
        return () => <div class={style.top}>
            <button class="button is-small is-link mr-1">
                <span class="icon"><i class="fa fa-tag"/></span>
                <span>标签</span>
            </button>
            <button class="button is-small is-white mr-1">
                <span class="icon"><i class="fa fa-user-tag"/></span>
                <span>作者</span>
            </button>
            <button class="button is-small is-white mr-1">
                <span class="icon"><i class="fa fa-hashtag"/></span>
                <span>主题</span>
            </button>
        </div>
    }
})

const LeftColumn = defineComponent({
    setup() {
        return () => <div class={style.left}>

        </div>
    }
})

const RightColumn = defineComponent({
    setup() {
        return () => <div class={style.right}>

        </div>
    }
})
