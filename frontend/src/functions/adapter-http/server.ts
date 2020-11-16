import axios, { Method } from "axios"

export interface HttpInstance {
    /**
     * 发送一个请求到server。
     */
    request<R>(config: RequestConfig): Promise<Response<R>>
    /**
     * 创建带有path和query参数的柯里化请求。
     */
    createPathQueryRequest: <P, Q, R>(url: (path: P) => string, method?: Method) => (path: P, query: Q) => Promise<Response<R>>
    /**
     * 创建带有path和data参数的柯里化请求。
     */
    createPathDataRequest: <P, T, R>(url: (path: P) => string, method?: Method) => (path: P, data: T) => Promise<Response<R>>
    /**
     * 创建带有path参数的柯里化请求。
     */
    createPathRequest: <P, R>(url: (path: P) => string, method?: Method) => (path: P) => Promise<Response<R>>
    /**
     * 创建带有query参数的柯里化请求。
     */
    createQueryRequest: <Q, R>(url: string, method?: Method) => (query: Q) => Promise<Response<R>>
    /**
     * 创建带有data参数的柯里化请求。
     */
    createDataRequest: <T, R>(url: string, method?: Method) => (data: T) => Promise<Response<R>>
    /**
     * 创建不带任何参数的柯里化请求。
     */
    createRequest: <R>(url: string, method?: Method) => () => Promise<Response<R>>
    /**
     * 获得token。
     */
    getToken(): string | undefined
    /**
     * 设置token。
     */
    setToken(token: string | undefined): void
}

export interface HttpInstanceOptions {
    token?: string
    baseURL?: string
}

export function createHttpInstance({ token, baseURL }: HttpInstanceOptions): HttpInstance {
    const instance = axios.create({baseURL})
    let headers = token ? {'Authorization': `Bearer ${token}`} : undefined

    function request<R>(config: RequestConfig): Promise<Response<R>> {
        return new Promise(resolve => {
            instance.request({
                url: config.url,
                method: config.method,
                params: config.query,
                data: config.data,
                headers
            })
            .then(res => resolve({
                ok: true,
                status: res.status,
                data: res.data
            }))
            .catch(reason => {
                if(reason.response) {
                    const data = reason.response.data as {code: string, message: string | null, info: any}
                    resolve({
                        ok: false,
                        status: reason.response.status,
                        code: data.code,
                        message: data.message
                    })
                }else{
                    resolve({
                        ok: false,
                        status: undefined,
                        message: reason.message
                    })
                }
            })
        })
    }

    return {
        request,
        createPathQueryRequest: <P, Q, R>(url: (path: P) => string, method?: Method) => (path: P, query: Q) => request<R>({url: url(path), method, query}),
        createPathDataRequest: <P, T, R>(url: (path: P) => string, method?: Method) => (path: P, data: T) => request<R>({url: url(path), method, data}),
        createPathRequest: <P, R>(url: (path: P) => string, method?: Method) => (path: P) => request<R>({url: url(path), method}),
        createQueryRequest: <Q, R>(url: string, method?: Method) => (query: Q) => request<R>({url, method, query}),
        createDataRequest: <T, R>(url: string, method?: Method) => (data: T) => request<R>({url, method, data}),
        createRequest: <R>(url: string, method?: Method) => () => request<R>({url, method}),
        getToken() {
            return token
        },
        setToken(newToken: string | undefined) {
            token = newToken
            headers = token ? {'Authorization': `Bearer ${token}`} : undefined
        }
    }
}

interface RequestConfig {
    url: string
    method?: Method
    query?: {[name: string]: any}
    data?: any
}

export type Response<T> = ResponseOk<T> | ResponseError | ResponseConnectionError

interface ResponseOk<T> {
    ok: true
    status: number
    data: T
}

interface ResponseError {
    ok: false
    status: number
    code: string
    message: string | null
}

interface ResponseConnectionError {
    ok: false
    status: undefined
    message: string
}