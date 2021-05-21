import { onMounted, onUnmounted } from "vue"
import { installation } from "@/functions/utils/basic"

export interface GlobalKeyEvent {
    /**
     * 按键代码。
     */
    key: string
    /**
     * 是否一同按下alt。
     */
    altKey: boolean
    /**
     * 是否一同按下shift。
     */
    shiftKey: boolean
    /**
     * 是否一同按下meta。这个键指Win/Super/Cmd。
     */
    metaKey: boolean
    /**
     * 是否一同按下ctrl。
     */
    ctrlKey: boolean
    /**
     * 阻止按键事件继续传递到上一个注册者。
     */
    stopPropagation(): void
    /**
     * 阻止按键事件的原本事件响应。
     */
    preventDefault(): void
}

/**
 * 提供一种全局统一处理全局按键响应的方式，用来处理除焦点元素外的按键响应，并确保它们按期望的顺序执行。
 */
export function watchGlobalKeyEvent(event: (e: GlobalKeyEvent) => void) {
    const { add, remove } = useGlobalKey()

    onMounted(() => add(event))
    onUnmounted(() => remove(event))
}

/**
 * 上层封装：只捕获特定的key类型，并默认拦截上层传递和按键响应。
 */
export function interceptGlobalKey(keys: string[], event: (key: string) => void) {
    watchGlobalKeyEvent(e => {
        if(keys.includes(e.key)) {
            event(e.key)
            e.preventDefault()
            e.stopPropagation()
        }
    })
}

const [installGlobalKey, useGlobalKey] = installation(function() {
    onMounted(() => document.addEventListener("keydown", keydown))
    onUnmounted(() => document.removeEventListener("keydown", keydown))

    function keydown(keyboardEvent: KeyboardEvent) {
        const consumer: GlobalKeyEvent = {
            key: keyboardEvent.key,
            altKey: keyboardEvent.altKey,
            shiftKey: keyboardEvent.shiftKey,
            metaKey: keyboardEvent.metaKey,
            ctrlKey: keyboardEvent.ctrlKey,
            stopPropagation() {
                stopPropagation = true
            },
            preventDefault() {
                keyboardEvent.returnValue = false
            }
        }
        let stopPropagation = false

        for(const call of calls) {
            call(consumer)
            if(stopPropagation) {
                break
            }
        }
    }

    const calls: ((e: GlobalKeyEvent) => void)[] = []

    const add = (call: (e: GlobalKeyEvent) => void) => {
        calls.unshift(call)
    }
    const remove = (call: (e: GlobalKeyEvent) => void) => {
        const i = calls.indexOf(call)
        calls.splice(i, 1)
    }

    return {add, remove}
})

export { installGlobalKey }
