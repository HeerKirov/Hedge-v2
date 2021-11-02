import { AnalysedKeyPress, analyseKeyPress, KeyCode, KeyPress } from "./definition"
import { clientPlatform } from "@/functions/adapter-ipc"

export interface KeyEvent extends AnalysedKeyPress {
    /**
     * 按键代码。
     */
    key: KeyCode
    /**
     * 是否一同按下alt(win/linux)/option(mac)。
     */
    altKey: boolean
    /**
     * 是否一同按下shift。
     */
    shiftKey: boolean
    /**
     * 是否一同按下ctrl(win/linux)/cmd(mac)。这个属性整合了平台差异。
     */
    metaKey: boolean
    /**
     * 阻止事件继续向上/向前传递。
     */
    stopPropagation(): void
    /**
     * 阻止按键事件的原本事件响应。
     */
    preventDefault(): void
    /**
     * 事件发起者。
     */
    target: EventTarget | null
}

/**
 * 快捷处理：只拦截处理{Enter}事件。
 */
export function onKeyEnter(func: (e: KeyEvent) => void) {
    return function(e: KeyEvent) {
        if(e.key === "Enter" && !e.metaKey && !e.altKey && !e.shiftKey) {
            func(e)
        }
    }
}

/**
 * 判断一个事件是否符合给定的keypress。
 */
export function keyboardEventCheck(key: AnalysedKeyPress, e: KeyboardEvent): boolean {
    return key.key === e.key && key.altKey === e.altKey && key.shiftKey === e.shiftKey && key.metaKey === ((clientPlatform === "darwin" && e.metaKey) || (clientPlatform !== "darwin" && e.ctrlKey))
}

/**
 * 判断一个事件是否符合给定的keypress。
 */
export function keyEventCheck(key: AnalysedKeyPress, e: KeyEvent): boolean {
    return key.key === e.key && key.altKey === e.altKey && key.shiftKey === e.shiftKey && key.metaKey === e.metaKey
}

/**
 * 解析一组按键描述，生成一个判断器。
 */
export function createKeyboardEventChecker(key: KeyPress | KeyPress[] | undefined): (e: KeyboardEvent) => boolean {
    if(key instanceof Array) {
        const ks = key.map(analyseKeyPress)
        return (e) => ks.some(k => keyboardEventCheck(k, e))
    }else if(key !== undefined) {
        const k = analyseKeyPress(key)
        return (e) => keyboardEventCheck(k, e)
    }else{
        return () => false
    }
}

/**
 * 解析一组按键描述，生成一个判断器。
 */
export function createKeyEventChecker(key: KeyPress | KeyPress[] | undefined): (e: KeyEvent) => boolean {
    if(key instanceof Array) {
        const ks = key.map(analyseKeyPress)
        return (e) => ks.some(k => keyEventCheck(k, e))
    }else if(key !== undefined) {
        const k = analyseKeyPress(key)
        return (e) => keyEventCheck(k, e)
    }else{
        return () => false
    }
}

/**
 * 将原生事件转换为代理事件。
 */
export function toKeyEvent(e: KeyboardEvent): KeyEvent {
    return {
        key: e.key as KeyCode,
        altKey: e.altKey,
        shiftKey: e.shiftKey,
        metaKey: (clientPlatform === "darwin" && e.metaKey) || (clientPlatform !== "darwin" && e.ctrlKey),
        target: e.target,
        stopPropagation() {
            e.stopPropagation()
            e.stopImmediatePropagation()
        },
        preventDefault() {
            e.preventDefault()
        }
    }
}
