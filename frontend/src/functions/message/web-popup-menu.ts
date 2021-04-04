import { computed, inject, InjectionKey, isReactive, provide, ref, Ref, unref, watch, watchEffect } from "vue"
import { MenuTemplate } from "@/functions/adapter-ipc";

//TODO 调整web popup menu，实现，并引入到VCA

export interface PopupMenuManager {
    popup(items: MenuItem[], scale?: {x: number, y: number})
}

export interface PopupMenuConsumer extends PopupMenuManager {
    value: Ref<{items: MenuItem[], scale?: {x: number, y: number}} | null>
}

export type MenuItem = ButtonMenuItem | CheckboxMenuItem | RatioMenuItem | SeparatorMenuItem | SubMenuItem

interface SeparatorMenuItem {
    type: "separator"
}
interface ButtonMenuItem {
    type: "normal"
    label: string
    enabled?: boolean
    click?()
}
interface CheckboxMenuItem {
    type: "checkbox"
    label: string
    enabled?: boolean
    checked?: boolean
    click?()
}
interface RatioMenuItem {
    type: "radio"
    label: string
    enabled?: boolean
    checked?: boolean
    click?()
}
interface SubMenuItem {
    type: "submenu"
    label: string
    enabled?: boolean
    submenu: MenuItem[]
}

export function installWebPopupMenuManager(): PopupMenuConsumer {
    const value = ref<{items: MenuItem[], scale?: {x: number, y: number}} | null>(null)

    const consumer: PopupMenuConsumer = {
        value,
        popup(items: MenuItem[], scale?: { x: number; y: number }) {
            value.value = {items, scale}
        }
    }

    provide(popupMenuInjection, consumer)

    return consumer
}

export function useWebPopupMenuManager(): PopupMenuManager {
    return useWebPopupMenuConsumer()
}

export function useWebPopupMenu(items: MenuItem[] | Ref<MenuItem[]> | (() => MenuItem[])) {
    const menuManager = useWebPopupMenuManager()

    const element = ref<HTMLElement>()
    let menuItems: MenuTemplate[] = []
    if(typeof items === "function") {
        const data = computed(items)
        menuItems = data.value
        watch(data, value => menuItems = value)
    }else if(isReactive(items)) {
        watchEffect(() => menuItems = unref(items))
    }else{
        menuItems = unref(items)
    }

    return {
        element,
        popup() {
            const rect = element.value?.getBoundingClientRect()

            menuManager.popup(menuItems, rect ? {x: Math.floor(rect.left), y: Math.floor(rect.top)} : undefined)
        }
    }
}

export function useWebPopupMenuConsumer(): PopupMenuConsumer {
    return inject(popupMenuInjection)!
}

const popupMenuInjection: InjectionKey<PopupMenuConsumer> = Symbol()