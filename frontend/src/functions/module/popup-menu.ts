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
type ClickFunction<T> = (args: T) => void

//== 二级包装的popup menu: 提供元素定位 ==

export interface ElementPopupMenuOptions {
    position?: "top" | "bottom"
    align?: "left" | "center"
    offsetX?: number
    offsetY?: number
}

export function useElementPopupMenu(items: MenuItem<undefined>[] | Ref<MenuItem<undefined>[]> | (() => MenuItem<undefined>[]), options?: ElementPopupMenuOptions): {
    element: Ref<HTMLElement>
    popup(): void
}
export function useElementPopupMenu<P>(items: MenuItem<P>[] | Ref<MenuItem<P>[]> | (() => MenuItem<P>[]), options?: ElementPopupMenuOptions): {
    element: Ref<HTMLElement>
    popup(args: P): void
}
export function useElementPopupMenu<P = undefined>(items: MenuItem<P>[] | Ref<MenuItem<P>[]> | (() => MenuItem<P>[]), options?: ElementPopupMenuOptions) {
    const element = ref<HTMLElement>()

    const menu = usePopupMenu(items)

    const popup = function popup(args?: P) {
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

//== 一级包装的popup menu: 提供根据popup参数动态生成的菜单 ==
export function useDynamicPopupMenu<P>(generator: (value: P) => (MenuItem<P> | null | undefined)[]) {
    function popup(args: P, options?: PopupOptions) {
        const items = generator(args).filter(item => item != null) as MenuItem<P>[]
        createPopupMenu(items)(options, args)
    }

    return {popup}
}

//== 一级包装的popup menu: 提供根据响应式变化生成的菜单 ==

export function usePopupMenu(items: MenuItem<undefined>[] | Ref<MenuItem<undefined>[]> | (() => MenuItem<undefined>[])): {
    popup(args?: undefined, options?: PopupOptions): void
}

export function usePopupMenu<P>(items: MenuItem<P>[] | Ref<MenuItem<P>[]> | (() => MenuItem<P>[])): {
    popup(args: P, options?: PopupOptions): void
}

export function usePopupMenu<P = undefined>(items: MenuItem<P>[] | Ref<MenuItem<P>[]> | (() => MenuItem<P>[])) {
    let popupFunction: (options: PopupOptions | undefined, args: P) => void

    if(typeof items === "function") {
        const data = computed(items)
        popupFunction = createPopupMenu(data.value)
        watch(data, value => popupFunction = createPopupMenu(value))
    }else if(isReactive(items) || isRef(items)) {
        popupFunction = <(options: PopupOptions | undefined, args: P) => void>function(_: PopupOptions) {}
        watchEffect(() => popupFunction = createPopupMenu(unref(items)))
    }else{
        popupFunction = createPopupMenu(unref(items))
    }

    const popup = function (args: P, options?: PopupOptions) {
        popupFunction(options, args)
    }

    return {popup}
}

//== 基础的popup menu: 提供popup menu对象创建和调用 ==

interface PopupOptions {
    x: number
    y: number
}

export function createPopupMenu(menuItems: MenuItem<undefined>[]): (options?: PopupOptions) => void
export function createPopupMenu<P = undefined>(menuItems: MenuItem<P>[]): (options: PopupOptions | undefined, args: P) => void
export function createPopupMenu<P = undefined>(menuItems: MenuItem<P>[]) {
    return createNativePopupMenu(menuItems)
}

//== 基础popup menu的electron实现

function createNativePopupMenu<P>(menuItems: MenuItem<P>[]) {
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

    return function(options: PopupOptions, args: P) {
        localArgument = args
        menu.popup(options)
    }
}
