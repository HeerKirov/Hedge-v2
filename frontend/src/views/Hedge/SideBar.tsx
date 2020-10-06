import { defineComponent, inject } from "vue"
import { sideBarSwitchInjection } from "."

/**
 * 主页面的侧栏内容。
 * 包括顶端的开关按钮(仅开启时)、中间的菜单列表、底部的功能按钮。
 */
export default defineComponent({
    setup() {
        const sideBarSwitch = inject(sideBarSwitchInjection)
        const collapseSideBar = () => {
            sideBarSwitch.value = false
        }

        return () => <div class="v-side-bar">
            <div class="title-bar absolute left-top w-100"></div>
            <button class="no-drag button is-light is-small v-collapse-button" onClick={collapseSideBar}><span class="icon"><i class="fa fa-lg fa-bars"/></span></button>
            <div class="v-menu">
                <aside class="menu">
                    <a class="menu-label">图库</a>
                    <ul class="menu-list">
                        <li><a class="v-item is-active"><span class="icon"><i class="fa fa-th mr-2"/></span>图库</a></li>
                        <li><a class="v-item"><span class="icon"><i class="fa fa-plus-square mr-2"/></span>最近导入</a></li>
                        <li>
                            <a class="v-item"><span class="icon"><i class="fa fa-calendar-alt mr-2"/></span>日历</a>
                            <ul class="mt-1 ml-4 pl-1">
                                <li><a class="v-subitem">2020年10月3日</a></li>
                                <li><a class="v-subitem is-active">2020年10月2日</a></li>
                                <li><a class="v-subitem">2020年10月1日</a></li>
                            </ul>
                        </li>
                        <li><a class="v-item"><span class="icon"><i class="fa fa-clone mr-2"/></span>画集</a></li>
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
            </div>
            <div class="v-buttons buttons">
                <button class="button is-small is-light mb-0"><span class="icon mr-2"><i class="fa fa-angle-double-left"/></span>HEDGE</button>
                <button class="button is-small is-light mb-0"><span class="icon"><i class="fa fa-cog"/></span></button>
                <button class="button is-small is-light mb-0"><span class="icon"><i class="fa fa-question-circle"/></span></button>
            </div>
        </div>
    }
})