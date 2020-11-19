import { ref, Ref, watch } from "vue"
import { useAppInfo } from './app-info'

/**
 * 引用一个local storage存储器。
 * 存储器在不同端有不同的实现。在web下，它使用浏览器的localStorage实现；在client下，它使用client的本地storage file实现。
 * @param bucketName 存储器使用的名称
 * @return 存储的响应式数据。null表示无值，其他表示有值
 */
export function useLocalStorage<T>(bucketName: string): Ref<T | null> {
    const appInfo = useAppInfo()

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
    })

    return data
}