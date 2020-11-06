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

        return () => <div class={style.sideBar}>
            <div class="title-bar absolute left-top w-100"></div>
            <div class={style.content}>
                <p class="is-size-5 mt-2 ml-1">设置</p>
                <aside class="h-menu mt-2">
                    {settings.map(scope => <>
                        <span class="menu-label">{scope.label}</span>
                        <ul class="menu-list">
                            {scope.list.map(item => <li>
                                <a class={{"is-active": routeName.value === item.route}} onClick={() => router.push({name: item.route})}>
                                    <span class="icon"><i class={`fa fa-${item.icon}`}/></span>{item.name}
                                </a>
                            </li>)}
                        </ul>
                    </>)}
                </aside>
            </div>
        </div>
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
            {route: "SettingAppWebAccess", name: "局域网访问", icon: "network-wired"}
        ]
    },
    {
        label: "数据库事务",
        list: [
            {route: "SettingDatabaseGeneral", name: "通用", icon: "coffee"},
            {route: "SettingDatabaseImport", name: "导入选项", icon: "file-import"},
            {route: "SettingDatabaseOriginal", name: "原始数据解析选项", icon: "cloud-download-alt"},
            {route: "SettingDatabaseFile", name: "文件系统管理", icon: "file-image"}
        ]
    },
    {
        label: "数据杂项",
        list: [
            {route: "SettingDataBackup", name: "备份与还原", icon: "sync-alt"}
        ]
    }
]