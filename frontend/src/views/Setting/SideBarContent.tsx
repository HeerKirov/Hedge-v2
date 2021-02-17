import { defineComponent, toRef } from "vue"
import { useRoute, useRouter } from "vue-router"
import style from "./style.module.scss"

/**
 * 主页面的侧栏内容的框架模块。只提供布局框架，以及基本功能，比如折叠按钮，以及底栏的基本功能按钮。
 */
export default defineComponent({
    setup() {
        const route = useRoute()
        const router = useRouter()

        const routeName = toRef(route, 'name')

        return () => <>
            <p class="is-size-4">设置</p>
            <aside class="menu deep">
                {settings.map(scope => <>
                    <span class="menu-label">{scope.label}</span>
                    <ul class="menu-list">
                        {scope.list.map(item => <li>
                            <a class={{"is-active": routeName.value === item.route}} onClick={() => router.push({name: item.route})}>
                                <span class="icon"><i class={`fa fa-${item.icon}`}/></span><span>{item.name}</span>
                            </a>
                        </li>)}
                    </ul>
                </>)}
            </aside>
        </>
    }
})

interface SettingScope {
    label: string,
    list: SettingItem[]
}

interface SettingItem {
    route: string
    name: string
    icon: string
}

const settings: SettingScope[] = [
    {
        label: "应用程序",
        list: [
            {route: "SettingAppSecurity", name: "安全与认证", icon: "key"},
            {route: "SettingWebAccess", name: "局域网访问", icon: "network-wired"},
            {route: "SettingBackup", name: "备份与还原", icon: "sync-alt"}
        ]
    },
    {
        label: "数据库事务",
        list: [
            {route: "SettingDBGeneral", name: "通用", icon: "coffee"},
            {route: "SettingDBImport", name: "导入选项", icon: "plus-square"},
            {route: "SettingDBSpider", name: "爬虫选项", icon: "spider"},
            {route: "SettingDBFile", name: "文件管理选项", icon: "folder-open"}
        ]
    },
    {
        label: "高级选项",
        list: [
            {route: "SettingServer", name: "核心服务", icon: "server"},
            {route: "SettingCli", name: "命令行工具", icon: "terminal"},
            {route: "SettingChannel", name: "频道", icon: "coins"},
        ]
    }
]