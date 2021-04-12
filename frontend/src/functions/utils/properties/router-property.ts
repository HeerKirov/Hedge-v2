import { computed, ref, Ref, watch } from "vue"
import { LocationQueryValue, useRoute, useRouter } from "vue-router"

/**
 * 提供对一个router param的reactive引用。
 */
export function useRouterQuery<T>(routerName: string | null, queryName: string, encode: (d: T) => string, decode: (param: string) => T | null): Ref<T | null> {
    const router = useRouter()
    const route = useRoute()

    const data: Ref<T | null> = ref(null)

    function setNewData(value: T | null) {
        router.push({
            name: route.name!,
            query: {
                ...route.query,
                [queryName]: value != null ? encode(value) : null
            }
        }).finally()
    }

    function calcNewData(): T | null {
        if(routerName === null || route.name === routerName) {
            const v = <LocationQueryValue>route.query[queryName]
            if(v != null) {
                return decode(v)
            }
        }
        return null
    }

    watch(() => <[typeof route.name, typeof route.query[string]]>[route.name, route.query[queryName]], () => data.value = calcNewData(), {immediate: true, deep: true})

    return computed({
        get: () => data.value,
        set: setNewData
    })
}

export function useRouterQueryString(routerName: string | null, queryName: string) {
    return useRouterQuery<string>(routerName, queryName, s => s, s => s)
}

export function useRouterQueryNumber(routerName: string | null, queryName: string) {
    return useRouterQuery<number>(routerName, queryName, s => s.toString(), s => {
        const n = parseInt(s)
        if(isNaN(n)) {
            return null
        }
        return n
    })
}