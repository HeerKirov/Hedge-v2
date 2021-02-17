import { defineComponent, toRef } from "vue"
import { useRoute, useRouter } from "vue-router"

/**
 * 主页面的侧栏内容的框架模块。只提供布局框架，以及基本功能，比如折叠按钮，以及底栏的基本功能按钮。
 */
export default defineComponent({
    setup() {
        const route = useRoute()
        const router = useRouter()

        const routeName = toRef(route, 'name')

        return () => <>
            <p class="is-size-4">向导</p>
            <aside class="menu">
                {settings.map(scope => <>
                    <p class="menu-label">{scope.label}</p>
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
        label: "入门",
        list: [
            {route: "GuideBeginIntroduction", name: "介绍", icon: "info"}
        ]
    }
]