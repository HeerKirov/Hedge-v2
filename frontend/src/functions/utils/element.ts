import { onMounted, onUnmounted, reactive, readonly, ref, Ref, toRef, watch } from "vue"
import { interceptGlobalKey } from "@/functions/document/global-key"

/**
 * 提供一个observer，监视一个Element的Resize事件。
 * @param ref 引用此Element的ref
 * @param event 事件
 */
export function watchElementResize(ref: Ref<HTMLElement | undefined>, event: (rect: DOMRect) => void) {
    let element: HTMLElement | undefined = undefined
    const observer = new ResizeObserver(entries => event(entries[0].contentRect))

    onMounted(() => {
        if(ref.value) observer.observe(element = ref.value)
    })

    onUnmounted(() => {
        if(element) observer.unobserve(element)
    })

    watch(ref, v => {
        if(element) observer.unobserve(element)
        if((element = v) != undefined) observer.observe(element)
    })
}

/**
 * 注册一个监听事件，监听点击目标元素以外的元素的事件。
 * @param ref 监听点击此目标以外的元素
 * @param event 事件
 */
export function watchElementExcludeClick(ref: Ref<HTMLElement | undefined>, event: (e: MouseEvent) => void) {
    onMounted(() => {
        document.addEventListener("click", clickDocument)
    })

    onUnmounted(() => {
        document.removeEventListener("click", clickDocument)
    })

    const clickDocument = (e: MouseEvent) => {
        const target = e.target
        if(ref.value && !(ref.value === target || ref.value.contains(target as Node))) {
            event(e)
        }
    }
}

/**
 * 提供两个事件和一个ref用于监视鼠标是否悬停在目标元素上。
 */
export function useMouseHover() {
    const hover = ref(false)

    const mouseover = () => hover.value = true

    const mouseleave = () => hover.value = false

    return {hover, mouseover, mouseleave}
}

/**
 * 选择器的列表项。
 */
export interface KeyboardSelectorItem {
    key: number | string, event(): void
}

/**
 * 提供使用Up/Down/Enter进行选择的按键选择器。
 */
export function useKeyboardSelector(items: Ref<KeyboardSelectorItem[]>) {
    interceptGlobalKey(["ArrowUp", "ArrowDown"], key => {
        if(items.value.length) {
            if(key === "ArrowUp") {
                if(selected.index === null || selected.index === 0) {
                    selected.index = items.value.length - 1
                }else{
                    selected.index -= 1
                }
            }else if(key === "ArrowDown") {
                if(selected.index === null || selected.index === items.value.length - 1) {
                    selected.index = 0
                }else{
                    selected.index += 1
                }
            }
            selected.key = items.value[selected.index!]?.key ?? null

            const el = selected.index !== null && elements.value[selected.key]
            if(el) {
                el.scrollIntoView({block: "nearest"})
            }
        }
    })

    interceptGlobalKey(["Enter"], () => {
        if(selected.index === null) {
            selected.index = 0
            selected.key = items.value[0]?.key ?? null
        }else{
            items.value[selected.index]?.event()
        }
    })

    watch(items, () => {
        console.log(selected.key, selected.index, items.value)
        if(selected.index === null || selected.index >= items.value.length) {
            selected.key = null
            selected.index = null
        }else{
            selected.key = items.value[selected.index]?.key ?? null
        }
    }, {deep: true})

    const elements = ref<{[key in string | number]: Element}>({})

    const selected = reactive<{key: string | number | null, index: number | null}>({key: null, index: null})

    const selectedKey = toRef(selected, "key")

    return {elements, selectedKey: readonly(selectedKey)}
}
