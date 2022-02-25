import { useRoute, useRouter } from "vue-router"
import { RouteName, RouteParameter } from "@/services/global/router/definitions"
import { windowManager } from "@/services/module/window-manager"
import { date } from "@/utils/datetime"
import { useRouterParamManager } from "./params"


export interface RouterNavigator {
    goto(routeName: RouteName)
    goto<N extends RouteName>(options: {routeName: N, params?: RouteParameter[N]["params"], query?: Partial<RouteParameter[N]["query"]>})
    newWindow(routeName: RouteName)
    newWindow<N extends RouteName>(options: {routeName: N, params?: RouteParameter[N]["params"], query?: Partial<RouteParameter[N]["query"]>})
}

/**
 * 控制按照需要进行导航跳转。
 * 不是所有的route跳转都需要通过它。它主要只负责Main内的业务页面跳转，因为这些页面跳转有着更为复杂的业务参数，还需要params。
 */
export function useRouterNavigator(): RouterNavigator {
    const router = useRouter()
    const manager = useRouterParamManager()

    function goto<N extends RouteName>(options: {routeName: N, params?: RouteParameter[N]["params"], query?: Partial<RouteParameter[N]["query"]>} | N) {
        const routeName = typeof options === "string" ? options : options.routeName
        const params = typeof options === "object" ? options.params : undefined
        const query = typeof options === "object" ? options.query : undefined

        if(params !== undefined) {
            manager.emit(routeName, params)
        }

        const routeQuery = query !== undefined ? encodeRouteQuery(routeName, query) : undefined

        router.push({
            name: routeName,
            query: routeQuery
        }).finally()
    }

    function newWindow<N extends RouteName>(options: {routeName: N, params?: RouteParameter[N]["params"], query?: Partial<RouteParameter[N]["query"]>} | N) {
        const routeName = typeof options === "string" ? options : options.routeName
        const params = typeof options === "object" ? options.params : undefined
        const query = typeof options === "object" ? options.query : undefined

        windowManager.newWindow(`/?routeName=${routeName}` +
            `&params=${params !== undefined ? encodeURIComponent(btoa(JSON.stringify(params))) : ""}` +
            `&query=${query !== undefined ? encodeURIComponent(btoa(JSON.stringify(query))) : ""}`)
    }

    return {goto, newWindow}
}

/**
 * 此函数应该被Index页面引用，以在初始化时对初始化导航参数做处理，跳转到想去的页面。
 */
export function useNewWindowRouteReceiver() {
    const route = useRoute()
    const navigator = useRouterNavigator()

    return {
        receiveRoute() {
            const routeName = (route.query["routeName"] || undefined) as RouteName | undefined
            if(routeName === undefined) return false

            const paramsStr = route.query["params"] as string | undefined
            const queryStr = route.query["query"] as string | undefined
            const paramsDecoded = paramsStr && atob(paramsStr)
            const queryDecoded = queryStr && atob(queryStr)
            const params = paramsDecoded ? JSON.parse(paramsDecoded) : undefined
            const query = queryDecoded ? JSON.parse(queryDecoded) : undefined

            navigator.goto({routeName, params, query})

            return true
        }
    }
}

function encodeRouteQuery<N extends RouteName>(routeName: N, query: Partial<RouteParameter[N]["query"]>): Record<string, string> | undefined {
    if(routeName === "MainTopics" || routeName === "MainAuthors" || routeName === "MainTags" || routeName === "MainAnnotations") {
        return query["detail"] && {
            detail: query["detail"]
        }
    }else if(routeName === "MainPartitions") {
        return query["detail"] && {
            detail: date.toISOString(query["detail"])
        }
    }
    return undefined
}
