import { inject, InjectionKey, provide, readonly, ref, Ref, watch } from "vue"
import { Platform } from "../adapter-ipc/definition"
import { BasicComponentInjection } from "./install"
import { useAppInfo } from "./app-info"

export function provideStateManager() {

}

/**
 * 查看App当前所处的基本状态，包括“需要初始化”、“需要登录”、“已加载完毕”。通过这个状态来判别App能否处于某些页面中。这个状态不是响应式的。
 */
export function useAppState() {
    
}

export function useInitManager() {
    
}