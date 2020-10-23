import { defineComponent } from "vue"

/**
 * 主页面的侧栏内容的框架模块。只提供布局框架，以及基本功能，比如折叠按钮，以及底栏的基本功能按钮。
 */
export default defineComponent({
    setup() {
        return () => <div id="side-bar">
            <div class="title-bar absolute left-top w-100"></div>
            <div class="v-content">
                <p class="is-size-5">设置</p>
                <aside class="h-menu mt-2">
                    <a class="menu-label">应用程序</a>
                    <ul class="menu-list">
                        <li><a class="is-active"><span class="icon"><i class="fa fa-key"/></span>安全与认证</a></li>
                        <li><a><span class="icon"><i class="fa fa-network-wired"/></span>局域网访问</a></li>
                        <li><a><span class="icon"><i class="fa fa-paper-plane"/></span>网络代理</a></li>
                    </ul>
                    <a class="menu-label">数据库事务</a>
                    <ul class="menu-list">
                        <li><a><span class="icon"><i class="fa fa-coffee"/></span>通用</a></li>
                        <li><a><span class="icon"><i class="fa fa-file-import"/></span>导入选项</a></li>
                        <li><a><span class="icon"><i class="fa fa-cloud-download-alt"/></span>原始数据解析选项</a></li>
                        <li><a><span class="icon"><i class="fa fa-file-image"/></span>文件系统管理</a></li>
                    </ul>
                    <a class="menu-label">数据杂项</a>
                    <ul class="menu-list">
                    <li><a><span class="icon"><i class="fa fa-sync-alt"/></span>备份与还原</a></li>
                    </ul>
                </aside>
            </div>
        </div>
    }
})
