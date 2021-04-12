import { provide, inject, InjectionKey, reactive, watch } from "vue"

export function installNavigatorManager() {
    const eventBoard = reactive<{[key: string]: any}>({})

    provide(navigatorManagerInjection, eventBoard)
}

export function useNavigatorManager() {
    const eventBoard = inject(navigatorManagerInjection)!

    const emit = (routeName: string, params: any) => {
        eventBoard[routeName] = params
    }

    return {emit}
}

export function watchNavigatorEvent<P>(routeName: string, event: (params: P) => void) {
    const eventBoard = inject(navigatorManagerInjection)!
    watch(() => eventBoard[routeName], value => {
        if(value !== undefined) {
            event(value)
            delete eventBoard[routeName]
        }
    }, {immediate: true})
}

const navigatorManagerInjection: InjectionKey<{[key: string]: any}> = Symbol()