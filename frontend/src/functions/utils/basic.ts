import { Ref, ref, UnwrapRef, watchEffect } from "vue"


export function useMutableComputed<T>(call: () => T): Ref<T> {
    const data = <Ref<T>>ref(call())
    watchEffect(() => data.value = call())
    return data
}
