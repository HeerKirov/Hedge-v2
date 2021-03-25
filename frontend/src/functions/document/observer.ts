import { onMounted, onUnmounted, Ref, watch } from "vue"

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