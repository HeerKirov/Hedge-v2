import { inject, InjectionKey, provide, Ref, ref, watchEffect } from "vue"


export function useMutableComputed<T>(call: () => T): Ref<T> {
    const data = <Ref<T>>ref(call())
    watchEffect(() => data.value = call())
    return data
}

export function installation<F extends (...args: any[]) => any>(func: F) {
    type P = Parameters<typeof func>
    type R = ReturnType<typeof func>

    const injection: InjectionKey<R> = Symbol()

    const install = (...args: P) => {
        const d = func(...args)
        provide(injection, d)
        return d
    }

    const use = () => inject(injection)!!

    return [install, use] as [(...args: P) => R, () => R]
}
