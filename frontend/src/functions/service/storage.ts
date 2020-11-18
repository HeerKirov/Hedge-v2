import { inject, ref, Ref, watch } from "vue"
import { BasicComponentInjection } from "./install"

/**
 * 引用一个local storage存储器。
 * 存储器在不同端有不同的实现。在web下，它使用浏览器的localStorage实现；在client下，它使用client的本地storage file实现。
 * @param bucketName 存储器使用的名称
 * @return 存储的响应式数据。undefined值表示尚未加载完毕，null表示无值，其他表示有值
 */
export function useLocalStorage<T>(bucketName: string): Ref<T | null | undefined> {
    const { clientMode, ipc } = inject(BasicComponentInjection)!

    const storageName = `${bucketName}`

    const data: Ref<T | null | undefined> = ref((() => {
        const value = window.localStorage.getItem(storageName)
        return value != undefined ? JSON.parse(value) : null
    })())

    watch(data, value => {
        if(value != null) {
            window.localStorage.setItem(storageName, JSON.stringify(value))
        }else{
            window.localStorage.removeItem(storageName)
        }
    })

    return data
}