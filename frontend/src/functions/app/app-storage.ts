import { computed, ref, Ref, watch } from "vue"
import { AppInfo, useAppInfo } from "./app-state"

/**
 * 引用一个local storage存储器。
 * 存储器在不同端有不同的实现。在web下，它使用浏览器的localStorage实现；在client下，它使用client的本地storage file实现。
 * @param bucketName 存储器使用的名称
 * @param provideAppInfo 在install中引用时，提供appInfo
 * @return 存储的响应式数据。null表示无值，其他表示有值
 */
export function useLocalStorage<T>(bucketName: string, provideAppInfo?: AppInfo): Ref<T | null> {
    const appInfo = provideAppInfo ?? useAppInfo()

    const storageName = appInfo.clientMode 
        ? `com.heerkirov.hedge.v2/${appInfo.channel}/${bucketName}` 
        : `com.heerkirov.hedge.v2/${bucketName}`

    const data: Ref<T | null> = ref((() => {
        const value = window.localStorage.getItem(storageName)
        return value != undefined ? JSON.parse(value) : null
    })())

    watch(data, value => {
        if(value != null) {
            window.localStorage.setItem(storageName, JSON.stringify(value))
        }else{
            window.localStorage.removeItem(storageName)
        }
    }, {deep: true})

    return data
}

export function useLocalStorageWithDefault<T>(bucketName: string, defaultValue: T): Ref<T> {
    const storage = useLocalStorage<T>(bucketName)

    return computed({
        get: () => storage.value ?? defaultValue,
        set: value => storage.value = value
    })
}
