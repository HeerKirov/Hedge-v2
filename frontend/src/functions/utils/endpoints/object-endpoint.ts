import { ref, Ref, watch } from "vue"
import { HttpClient, Response } from "@/functions/adapter-http"
import { HttpException } from "@/functions/adapter-http/exception"
import { useHttpClient } from "@/functions/app"
import { useNotification } from "@/functions/module"

/* 此处提供了VCA形态的rest api端点调用器。目标是处理更复杂的detail对象。
    它的目标是处理支持retrieve, patch, delete的更复杂的模型，且支持path变更。
 */

export interface ObjectEndpoint<MODEL, FORM> {
    loading: Ref<Boolean>
    updating: Ref<Boolean>
    deleting: Ref<Boolean>
    data: Ref<MODEL | null>
    setData(form: FORM, handleError?: ErrorHandler): Promise<boolean>
    deleteData(): Promise<boolean>
}

export interface ObjectEndpointOptions<PATH, MODEL, FORM> {
    /**
     * 决定object的path属性。
     */
    path: Ref<PATH | null>
    /**
     * retrieve操作的函数。
     */
    get(httpClient: HttpClient): (path: PATH) => Promise<Response<MODEL>>
    /**
     * update操作的函数。
     */
    update?(httpClient: HttpClient): (path: PATH, form: FORM) => Promise<Response<MODEL | null>>
    /**
     * delete操作的函数。
     */
    delete?(httpClient: HttpClient): (path: PATH) => Promise<Response<unknown>>
    /**
     * 在path变化之前发生调用的事件。
     */
    beforePath?()
    /**
     * 在path变化之后发生调用的事件。
     */
    afterPath?()
    /**
     * 在get成功之后调用的事件。
     */
    afterGet?(path: PATH, data: MODEL)
    /**
     * 在update成功之后调用的事件。
     */
    afterUpdate?(path: PATH, data: MODEL)
    /**
     * 在delete成功之后调用的事件。
     */
    afterDelete?(path: PATH)
    /**
     * update过程中发生错误时的捕获函数。
     */
    handleUpdateError?: ErrorHandler
    /**
     * delete过程中发生错误时的捕获函数。
     */
    handleDeleteError?: ErrorHandler
}

export interface ErrorHandler {
    (e: HttpException): HttpException | void
}

export function useObjectEndpoint<PATH, MODEL, FORM>(options: ObjectEndpointOptions<PATH, MODEL, FORM>): ObjectEndpoint<MODEL, FORM> {
    const httpClient = useHttpClient()
    const notification = useNotification()

    const method = {
        get: options.get(httpClient),
        update: options.update?.(httpClient),
        delete: options.delete?.(httpClient)
    }

    const path = options.path
    const loading = ref(true)
    const updating = ref(false)
    const deleting = ref(false)
    const data: Ref<MODEL | null> = ref(null)

    watch(path, async (path, oldPath, onInvalidate) => {
        if(oldPath !== undefined) {
            options.beforePath?.()
        }
        if(path == null) {
            //path的值为null时，直接按not found处理
            loading.value = false
            data.value = null
        }else{
            let invalidate = false
            onInvalidate(() => invalidate = true)

            loading.value = true
            data.value = null
            const res = await method.get(path)
            if(invalidate) return
            if(res.ok) {
                data.value = res.data
                options.afterGet?.(path, data.value)
            }else if(res.exception && res.exception.code !== "NOT_FOUND") {
                //not found类错误会被包装，因此不会抛出
                notification.handleException(res.exception)
            }
            loading.value = false
        }
        if(oldPath !== undefined) {
            options.afterPath?.()
        }
    }, {immediate: true})

    const setData = async (form: FORM, handleError?: (e: HttpException) => HttpException | void): Promise<boolean> => {
        if(method.update && !updating.value && path.value != null) {
            updating.value = true
            try {
                const res = await method.update(path.value, form)
                if(res.ok) {
                    if(res.data) {
                        data.value = res.data
                        options.afterUpdate?.(path.value, data.value)
                    }else{
                        //在update函数没有提供返回值的情况下，去请求get函数以更新数据
                        const res = await method.get(path.value)
                        if(res.ok) {
                            data.value = res.data
                            options.afterUpdate?.(path.value, data.value)
                        }else if(res.exception) {
                            if(res.exception.code !== "NOT_FOUND") {
                                notification.handleException(res.exception)
                            }
                            data.value = null
                        }
                    }
                }else if(res.exception) {
                    //首先尝试让上层处理错误，上层拒绝处理则自行处理
                    const e = handleError ? handleError(res.exception) : options.handleUpdateError ? options.handleUpdateError(res.exception) : res.exception
                    if(e != undefined) notification.handleException(e)
                    return false
                }
            }finally{
                updating.value = false
            }
            return true
        }
        return false
    }

    const deleteData = async (): Promise<boolean> => {
        if(method.delete && !deleting.value && path.value != null) {
            deleting.value = true
            try {
                const res = await method.delete(path.value)
                if(res.ok) {
                    options.afterDelete?.(path.value)
                    data.value = null
                }else if(res.exception) {
                    //首先尝试让上层处理错误，上层拒绝处理则自行处理
                    const e = options.handleDeleteError ? options.handleDeleteError(res.exception) : res.exception
                    if(e != undefined) notification.handleException(e)
                    return false
                }
            }finally{
                deleting.value = false
            }
        }

        return true
    }

    return {data, loading, updating, deleting, setData, deleteData}
}
