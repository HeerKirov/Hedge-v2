import { onBeforeMount, onMounted, onUnmounted } from "vue"
import { clientPlatform } from "@/functions/adapter-ipc"
import { installation } from "@/functions/utils/basic"
import { AnalysedKeyPress, KeyCode, KeyPress } from "./definition"
import { createKeyEventChecker, KeyEvent } from "./event"

/**
 * 提供一种全局统一处理全局按键响应的方式，用来处理除焦点元素外的按键响应，并确保它们按期望的顺序执行。
 */
export function watchGlobalKeyEvent(event: (e: KeyEvent) => void) {
    const { add, remove } = useGlobalKey()

    onBeforeMount(() => add(event))
    onUnmounted(() => remove(event))
}

/**
 * 上层封装：只捕获特定的key类型，并默认拦截上层传递和按键响应。
 */
export function interceptGlobalKey(keys: KeyPress | KeyPress[], event: (e: AnalysedKeyPress) => void) {
    const checker = createKeyEventChecker(keys)
    watchGlobalKeyEvent(e => {
        if(checker(e)) {
            e.preventDefault()
            e.stopPropagation()
            event(e)
        }
    })
}

const [installGlobalKey, useGlobalKey] = installation(function() {
    onMounted(() => document.addEventListener("keydown", keydown))
    onUnmounted(() => document.removeEventListener("keydown", keydown))

    function keydown(keyboardEvent: KeyboardEvent) {
        const consumer: KeyEvent = {
            key: keyboardEvent.code as KeyCode,
            altKey: keyboardEvent.altKey,
            shiftKey: keyboardEvent.shiftKey,
            metaKey: (clientPlatform === "darwin" && keyboardEvent.metaKey) || (clientPlatform !== "darwin" && keyboardEvent.ctrlKey),
            target: keyboardEvent.target,
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

    const calls: ((e: KeyEvent) => void)[] = []

    const add = (call: (e: KeyEvent) => void) => {
        calls.unshift(call)
    }
    const remove = (call: (e: KeyEvent) => void) => {
        const i = calls.indexOf(call)
        calls.splice(i, 1)
    }

    return {add, remove}
})

export { installGlobalKey }
