import { InjectionKey, reactive, readonly, watch } from "vue"
import { useRoute } from "vue-router"
import { useLocalStorage } from "@/functions/app"

export const sideBarContextInjection: InjectionKey<SideBarContext> = Symbol()

/**
 * main panel页面的侧边栏相关的依赖。
 */
export interface SideBarContext {
    /**
     * 存储侧边栏子项的地方。可按route name读取对应的子项列表。
     */
    subItems: Readonly<{readonly [routeName: string]: readonly {readonly key: string, readonly title: string}[]}>,
    /**
     * 向侧边栏推送一个新的子项。前提是侧边栏已经支持了当前view。
     * @param key 子项的key。点击key做跳转时依赖key做跳转。
     * @param title 子项的title，会显示出来。
     */
    pushSubItem(key: string, title: string): void
    scopeStatus: {[scopeName: string]: boolean}
}

export function useSideBarContextInjection(maxCount: number = 5): SideBarContext {
    const { subItems, pushSubItem } = useSubItems(maxCount)
    const { scopeStatus } = useScopeStatus()

    return {subItems, pushSubItem, scopeStatus}
}

function useSubItems(maxCount: number) {
    const route = useRoute()

    const subItems = reactive<{[routeName: string]: {key: string, title: string}[]}>({})
    const pushSubItem = (key: string, title: string) => {
        const routeName = route.name as string
        const items = subItems[routeName] || (subItems[routeName] = [])
        for(let i = 0; i < items.length; ++i) {
            const item = items[i]
            if(item.key === key) {
                items[i] = {key, title}
                return
            }
        }

        if(items.length >= maxCount) {
            subItems[routeName] = [{key, title}, ...items.slice(0, items.length - 1)]
        }else{
            items.splice(0, 0, {key, title})
        }
    }

    return {subItems: readonly(subItems), pushSubItem}
}

function useScopeStatus() {
    const storage = useLocalStorage<{[scopeName: string]: boolean}>("sidebar-scope-status")

    const scopeStatus = reactive(storage.value ?? {})

    watch(() => scopeStatus, scopeStatus => storage.value = scopeStatus, {deep: true})

    return { scopeStatus }
}