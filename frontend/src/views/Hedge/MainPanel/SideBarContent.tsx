import { defineComponent } from "vue"

/**
 * 主要界面的侧边菜单栏。内嵌在通用布局内使用。
 */
export default defineComponent({
    setup() {
        /*subitem给二级项目使用。包括画集、日历、标签、主题、所有文件夹。
            在点进一个详情项目时，在subitem追加一条，并高亮显示。
            每个种类的subitem数量有上限，多了之后挤走旧的。
            日历默认就显示最近的几个时间项。
        */
        return () => <aside id="side-bar-menu" class="h-menu">
            <a class="menu-label">图库</a>
            <ul class="menu-list">
                <li><a class="is-active"><span class="icon"><i class="fa fa-th"/></span>图库</a></li>
                <li><a><span class="icon"><i class="fa fa-plus-square"/></span>最近导入</a></li>
                <li>
                    <a><span class="icon"><i class="fa fa-calendar-alt"/></span>时间分区</a>
                    <ul>
                        <li><a>2020年10月3日</a></li>
                        <li><a class="is-active">2020年10月2日</a></li>
                        <li><a>2020年10月1日</a></li>
                    </ul>
                </li>
                <li><a><span class="icon"><i class="fa fa-clone"/></span>画集</a></li>
            </ul>
            <a class="menu-label">元数据</a>
            <ul class="menu-list">
                <li><a><span class="icon"><i class="fa fa-tag"/></span>标签</a></li>
                <li>
                    <a class="is-active"><span class="icon"><i class="fa fa-user-tag"/></span>作者</a>
                    <ul>
                        <li><a>作者1</a></li>
                    </ul>
                </li>
                <li>
                    <a><span class="icon"><i class="fa fa-hashtag"/></span>主题</a>
                    <ul>
                        <li><a>主题1</a></li>
                    </ul>
                </li>
            </ul>
            <a class="menu-label">文件夹</a>
            <ul class="menu-list">
                <li>
                    <a><span class="icon"><i class="fa fa-archive"/></span>所有文件夹</a>
                    <ul>
                        <li><a>文件夹1</a></li>
                        <li><a>文件夹2</a></li>
                    </ul>
                </li>
                <li><a><span class="icon"><i class="fa fa-shopping-basket"/></span>临时文件夹</a></li>
                <li><a><span class="icon"><i class="fa fa-folder"/></span>pin的文件夹</a></li>
            </ul>
        </aside>
    }
})