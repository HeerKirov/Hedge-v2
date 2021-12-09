import { inject, InjectionKey, provide, ref, Ref, watch } from "vue"
import { RouteName, RouteParameter } from "./definitions"

/**
 * 顶层安装params管理器。
 */
export function installRouterParamManager() {
    provide(paramManagerInjection, ref<{routeName: RouteName, params: any} | null>(null))
}

/**
 * 由navigator所使用的params控制器。
 */
export function useRouterParamManager() {
    const content = inject(paramManagerInjection)!

    return {
        emit<N extends RouteName>(routeName: N, params: RouteParameter[N]["params"]) {
            content.value = {routeName, params}
        }
    }
}

/**
 * 使用当前route的params参数。监听这个参数的到来并发出通知事件。
 * 这不是vue router中的params参数。这个params参数是一种事件通知机制，用来通知既定的页面初始化它的参数。
 */
export function useRouterParamEvent<N extends RouteName>(routeName: N, callback: (params: RouteParameter[N]["params"]) => void) {
    const content = inject(paramManagerInjection)!
    watch(content, e => {
        if(e?.routeName === routeName && e.params !== undefined) {
            callback(e.params)
            content.value = null
        }
    }, {immediate: true})
}

const paramManagerInjection: InjectionKey<Ref<{routeName: RouteName, params: any} | null>> = Symbol()
