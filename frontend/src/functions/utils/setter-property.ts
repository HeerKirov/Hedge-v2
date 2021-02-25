import { Ref, ref, watch } from "vue"

/**
 * 构造一组变量和函数，用于检测属性值的更改行为。
 */
export function usePropertySot<T, W>(value: Ref<T>, watchValue: Ref<W> | (() => W), onSetValue: (newValue: W, oldValue: W) => T | undefined, onGetValue: (v: T) => void): [Ref<T>, Ref<boolean>, (v: T) => void, () => void] {
    const sot = ref(false)
    const set = (v: T) => {
        value.value = v
        sot.value = true
    }
    const save = () => {
        if(sot.value) {
            onGetValue(value.value)
            sot.value = false
        }
    }
    watch(watchValue, (n, o) => {
        const v = onSetValue(n, o)
        if(v !== undefined) {
            value.value = v
            sot.value = false
        }
    }, {deep: true})

    return [value, sot, set, save]
}