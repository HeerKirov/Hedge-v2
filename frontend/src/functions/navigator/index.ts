import { useRouter } from "vue-router"
import { useNavigatorManager, watchNavigatorEvent } from "./navigator-event"

export { watchNavigatorEvent }

/**
 * 一个高级导航器，提供确定的业务导航，提供特定的参数以跳转至需要的目标页面。
 * 对于拥有显式URL参数的页面，导航器使用query和param完成导航；
 * 对于没有这类参数，但仍需要提供隐式导航参数的页面，导航器使用另一个导航事件机制完成导航和参数通知，并需要页面配合处理。
 */
export interface Navigator {
    goto: {
        main: {
            illusts(options?: {topicName?: string})
            topics: {
                (options?: {parentId?: number})
                detail(topicId: number)
            }
        }
    }
}

export function useNavigator(): Navigator {
    const router = useRouter()
    const navigatorManager = useNavigatorManager()

    return {
        goto: {
            main: {
                illusts() {

                },
                topics: complexFunction(function(options) {
                    navigatorManager.emit("MainTopics", options ?? {})
                    router.push({name: "MainTopics"}).finally()
                }, {
                    detail(topicId: number) {
                        router.push({name: "MainTopics", query: {detail: topicId}}).finally()
                    }
                })
            }
        }
    }
}

function complexFunction<F, T>(func: F, attach: T): F & T {
    for(const [k, v] of Object.entries(attach)) {
        func[k] = v
    }

    return <F & T>func
}