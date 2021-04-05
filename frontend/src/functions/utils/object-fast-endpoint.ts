import { HttpException } from "@/functions/adapter-http/exception"
import { HttpClient, Response } from "@/functions/adapter-http"
import { useHttpClient } from "@/functions/service"
import { useNotification } from "@/functions/message"

/* 此处提供了VCA形态的rest api端点调用器，但是与endpoint不同，他的目的是快速处理指定id的object，而不是处理一个。
    它的API形态都是基于指定path的，因此也不提供任何响应式变量，所有数据都通过返回值提供。
 */

interface ObjectEndpoint<PATH, MODEL, FORM> {
    getData(path: PATH): Promise<MODEL | undefined>
    setData(path: PATH, form: FORM, handleError?: (e: HttpException) => HttpException | void): Promise<boolean>
    deleteData(path: PATH, handleError?: (e: HttpException) => HttpException | void): Promise<boolean>
}

interface ObjectEndpointOptions<PATH, MODEL, FORM> {
    get?(httpClient: HttpClient): (path: PATH) => Promise<Response<MODEL>>
    update?(httpClient: HttpClient): (path: PATH, form: FORM) => Promise<Response<MODEL | null>>
    delete?(httpClient: HttpClient): (path: PATH) => Promise<Response<unknown>>
    handleUpdateError?(e: HttpException): HttpException | void
    handleDeleteError?(e: HttpException): HttpException | void
}

export function useFastObjectEndpoint<PATH, MODEL, FORM>(options: ObjectEndpointOptions<PATH, MODEL, FORM>): ObjectEndpoint<PATH, MODEL, FORM> {
    const httpClient = useHttpClient()
    const notification = useNotification()

    const method = {
        get: options.get?.(httpClient),
        update: options.update?.(httpClient),
        delete: options.delete?.(httpClient)
    }

    const getData = async (path: PATH): Promise<MODEL | undefined> => {
        if(!method.get) throw new Error("options.get is not satisfied.")

        const res = await method.get(path)
        if(res.ok) {
            return res.data
        }else if(res.exception) {
            //首先尝试让上层处理错误，上层拒绝处理则自行处理
            const e = options.handleUpdateError ? options.handleUpdateError(res.exception) : res.exception
            if(e != undefined) notification.handleException(e)
        }
        return undefined
    }

    const setData = async (path: PATH, form: FORM, handleError?: (e: HttpException) => HttpException | void): Promise<boolean> => {
        if(!method.update) throw new Error("options.update is not satisfied.")

        const res = await method.update(path, form)
        if(res.ok) {
            return true
        }else if(res.exception) {
            //首先尝试让上层处理错误，上层拒绝处理则自行处理
            const e = handleError ? handleError(res.exception) : options.handleUpdateError ? options.handleUpdateError(res.exception) : res.exception
            if(e != undefined) notification.handleException(e)
        }
        return false
    }

    const deleteData = async (path: PATH, handleError?: (e: HttpException) => HttpException | void): Promise<boolean> => {
        if(!method.delete) throw new Error("options.delete is not satisfied.")
        const res = await method.delete(path)
        if(res.ok) {
            return true
        }else if(res.exception) {
            //首先尝试让上层处理错误，上层拒绝处理则自行处理
            const e = handleError ? handleError(res.exception) : options.handleDeleteError ? options.handleDeleteError(res.exception) : res.exception
            if(e != undefined) notification.handleException(e)
        }
        return false
    }

    return {getData, setData, deleteData}
}