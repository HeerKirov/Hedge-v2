import { reactive, readonly, watch } from "vue"
import { useRoute } from "vue-router"
import { installation } from "@/functions/utils/basic"
import { useLocalStorage } from "@/services/app"

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
    /**
     * 清空一个侧边栏历史记录。
     */
    clearSubItem(routeName: string): void
    /**
     * 保存每个scope的折叠状态。
     */
    scopeStatus: {[scopeName: string]: boolean}
    /**
     * 提供一个机制，用于在侧边栏固定一组子项。固定之后，相同项将无法再推入历史记录列表。
     */
    pinnedItems: Readonly<{readonly [routeName: string]: readonly {readonly key: string, readonly title: string}[]}>,
    /**
     * 修改这组固定子项。
     */
    setPinnedItems(routeName: string, items: {key: string, title: string}[])
}

export const [installSideBarContext, useSideBarContext] = installation(function(maxCount: number = 5): SideBarContext {
    const { subItems, pinnedItems, setPinnedItems, pushSubItem, clearSubItem } = useSubItems(maxCount)
    const { scopeStatus } = useScopeStatus()

    return {subItems, pinnedItems, setPinnedItems, pushSubItem, clearSubItem, scopeStatus}
})

function useSubItems(maxCount: number) {
    const route = useRoute()

    const subItems = reactive<{[routeName: string]: {key: string, title: string}[]}>({})

    const pushSubItem = (key: string, title: string) => {
        const routeName = route.name as string
        const items = subItems[routeName] || (subItems[routeName] = [])

        if(pinnedItems[routeName]?.find(item => item.key === key)) {
            return
        }

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

    const clearSubItem = (routeName: string) => subItems[routeName] = []

    const pinnedItems = reactive<{[routeName: string]: {key: string, title: string}[]}>({})

    const setPinnedItems = (routeName: string, items: {key: string, title: string}[]) => {
        pinnedItems[routeName] = items
        const pinnedItemKeys = items.map(item => item.key)
        const subItemList = subItems[routeName]
        if(subItemList) {
            const notPinnedSubItemList = subItemList.filter(item => !pinnedItemKeys.includes(item.key))
            if(notPinnedSubItemList.length < subItemList.length) {
                subItems[routeName] = notPinnedSubItemList
            }
        }
    }

    return {subItems: readonly(subItems), pinnedItems, setPinnedItems, pushSubItem, clearSubItem}
}

function useScopeStatus() {
    const storage = useLocalStorage<{[scopeName: string]: boolean}>("side-bar/scope-status")

    const scopeStatus = reactive(storage.value ?? {})

    watch(() => scopeStatus, scopeStatus => storage.value = scopeStatus, {deep: true})

    return { scopeStatus }
}
