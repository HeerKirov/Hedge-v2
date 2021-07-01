import { computed, isReactive, isRef, ref, Ref, unref, watch, watchEffect } from "vue"
import { remote, MenuTemplate } from "@/functions/adapter-ipc"

export type MenuItem<P> = ButtonMenuItem<P> | CheckboxMenuItem<P> | RadioMenuItem<P> | SeparatorMenuItem | SubMenuItem<P>

interface SeparatorMenuItem {
    type: "separator"
}
interface ButtonMenuItem<P> {
    type: "normal"
    label: string
    enabled?: boolean
    click?: ClickFunction<P>
}
interface CheckboxMenuItem<P> {
    type: "checkbox"
    label: string
    enabled?: boolean
    checked?: boolean
    click?: ClickFunction<P>
}
interface RadioMenuItem<P> {
    type: "radio"
    label: string
    enabled?: boolean
    checked?: boolean
    click?: ClickFunction<P>
}
interface SubMenuItem<P> {
    type: "submenu"
    label: string
    enabled?: boolean
    submenu: MenuItem<P>[]
}
type ClickFunction<T> = T extends undefined ? () => void : (args: T) => void

//== 二级包装的popup menu: 提供元素定位 ==

export interface ElementPopupMenuOptions {
    position?: "top" | "bottom"
    align?: "left" | "center"
    offsetX?: number
    offsetY?: number
}

export function useElementPopupMenu<P = undefined>(items: MenuItem<P>[] | Ref<MenuItem<P>[]> | (() => MenuItem<P>[]), options?: ElementPopupMenuOptions) {
    const element = ref<HTMLElement>()

    const menu = usePopupMenu(items)

    const popup = <(P extends undefined ? () => void : (args: P) => void)>function popup(args?: P) {
        const rect = element.value?.getBoundingClientRect()
        if(rect) {
            const x = Math.floor(rect.left) + (options?.align === "center" ? Math.floor(rect.width / 2) : 0) + (options?.offsetX ?? 0)
            const y = Math.floor(rect.top) + (options?.position === "bottom" ? Math.floor(rect.height) : 0) + (options?.offsetY ?? 0)
            menu.popup(args!, {x, y})
        }else{
            menu.popup(args!, undefined)
        }
    }

    return {element, popup}
}

//== 一级包装的popup menu: 提供响应元素变化的菜单项
export function useDynamicPopupMenu<P>(generator: (value: P) => (MenuItem<P> | null | undefined)[]) {
    function popup(args: P, options?: PopupOptions) {
        const items = generator(args).filter(item => item != null) as MenuItem<P>[]
        createPopupMenu(items)(options, args)
    }

    return {popup}
}

//== 一级包装的popup menu: 提供VCA形式调用 ==

export function usePopupMenu<P = undefined>(items: MenuItem<P>[] | Ref<MenuItem<P>[]> | (() => MenuItem<P>[])) {
    let popupFunction: PopupFunction<P>

    if(typeof items === "function") {
        const data = computed(items)
        popupFunction = createPopupMenu(data.value)
        watch(data, value => popupFunction = createPopupMenu(value))
    }else if(isReactive(items) || isRef(items)) {
        popupFunction = <PopupFunction<P>>function(_: PopupOptions) {}
        watchEffect(() => popupFunction = createPopupMenu(unref(items)))
    }else{
        popupFunction = createPopupMenu(unref(items))
    }

    const popup = <(P extends undefined ? (args?: P, options?: PopupOptions) => void : (args: P, options?: PopupOptions) => void)>function popup(args?: P, options?: PopupOptions) {
        popupFunction(options, args!)
    }

    return {popup}
}

//== 基础的popup menu: 提供popup menu对象创建和调用 ==

interface PopupOptions {
    x: number
    y: number
}

type PopupFunction<T> = T extends undefined ? (options: PopupOptions | undefined) => void : (options: PopupOptions | undefined, args: T) => void

export function createPopupMenu<P = undefined>(menuItems: MenuItem<P>[]): PopupFunction<P> {
    return createNativePopupMenu(menuItems)
}

//== 基础popup menu的electron实现

function createNativePopupMenu<P>(menuItems: MenuItem<P>[]): PopupFunction<P> {
    let localArgument: P | undefined = undefined

    function mapMenuItems(menuItems: MenuItem<P>[]): MenuTemplate[] {
        return menuItems.map(item => {
            if(item.type === "normal" || item.type === "checkbox" || item.type === "radio") {
                return {
                    ...item,
                    click() {
                        item.click?.(localArgument!)
                        localArgument = undefined
                    }
                }
            }else if(item.type === "submenu") {
                return {
                    ...item,
                    submenu: mapMenuItems(item.submenu)
                }
            }else{
                return item
            }
        })
    }

    const menu = remote.menu.createPopup(mapMenuItems(menuItems))

    return <PopupFunction<P>>function(options: PopupOptions, args: P) {
        localArgument = args
        menu.popup(options)
    }
}
