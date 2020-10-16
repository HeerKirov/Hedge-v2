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
        return () => <aside id="side-bar-menu">
            <a class="menu-label">图库</a>
            <ul class="menu-list">
                <li><a class="v-item is-active"><span class="icon"><i class="fa fa-th mr-2"/></span>图库</a></li>
                <li><a class="v-item"><span class="icon"><i class="fa fa-plus-square mr-2"/></span>最近导入</a></li>
                <li><a class="v-item"><span class="icon"><i class="fa fa-clone mr-2"/></span>画集</a></li>
                <li>
                    <a class="v-item"><span class="icon"><i class="fa fa-calendar-alt mr-2"/></span>日历</a>
                    <ul class="mt-1 ml-4 pl-1">
                        <li><a class="v-subitem">2020年10月3日</a></li>
                        <li><a class="v-subitem is-active">2020年10月2日</a></li>
                        <li><a class="v-subitem">2020年10月1日</a></li>
                    </ul>
                </li>
            </ul>
            <a class="menu-label">元数据</a>
            <ul class="menu-list">
                <li><a class="v-item"><span class="icon"><i class="fa fa-tag mr-2"/></span>标签</a></li>
                <li>
                    <a class="v-item is-active"><span class="icon"><i class="fa fa-hashtag mr-2"/></span>主题</a>
                    <ul class="mt-1 ml-4 pl-1">
                        <li><a class="v-subitem">主题1</a></li>
                    </ul>
                </li>
            </ul>
            <a class="menu-label">文件夹</a>
            <ul class="menu-list">
                <li>
                    <a class="v-item"><span class="icon"><i class="fa fa-archive mr-2"/></span>所有文件夹</a>
                    <ul class="mt-1 ml-4 pl-1">
                        <li><a class="v-subitem">文件夹1</a></li>
                        <li><a class="v-subitem">文件夹2</a></li>
                    </ul>
                </li>
                <li><a class="v-item"><span class="icon"><i class="fa fa-folder-minus mr-2"/></span>临时文件夹</a></li>
                <li><a class="v-item"><span class="icon"><i class="fa fa-folder mr-2"/></span>pin的文件夹</a></li>
            </ul>
        </aside>
    }
})