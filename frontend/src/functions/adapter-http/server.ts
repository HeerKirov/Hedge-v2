import { computed } from "vue"
import axios, { AxiosError, Method } from "axios"
import { HttpException } from "./exception"

export interface HttpInstance {
    /**
     * 发送一个请求到server。
     */
    request<R>(config: RequestConfig<R>): Promise<Response<R>>
    /**
     * 创建带有path和query参数的柯里化请求。
     */
    createPathQueryRequest<P, Q, R>(url: URLParser<P>, method?: Method, parser?: QueryParser<Q> | ResponseParser<R>): (path: P, query: Q) => Promise<Response<R>>
    /**
     * 创建带有path和data参数的柯里化请求。
     */
    createPathDataRequest<P, T, R>(url: URLParser<P>, method?: Method, parser?: DataParser<T> | ResponseParser<R>): (path: P, data: T) => Promise<Response<R>>
    /**
     * 创建带有path参数的柯里化请求。
     */
    createPathRequest<P, R>(url: URLParser<P>, method?: Method, parser?: ResponseParser<R>): (path: P) => Promise<Response<R>>
    /**
     * 创建带有query参数的柯里化请求。
     */
    createQueryRequest<Q, R>(url: string, method?: Method, parser?: QueryParser<Q> | ResponseParser<R>): (query: Q) => Promise<Response<R>>
    /**
     * 创建带有data参数的柯里化请求。
     */
    createDataRequest<T, R>(url: string, method?: Method, parser?: DataParser<T> | ResponseParser<R>): (data: T) => Promise<Response<R>>
    /**
     * 创建不带任何参数的柯里化请求。
     */
    createRequest<R>(url: string, method?: Method, parser?: ResponseParser<R>): () => Promise<Response<R>>
}

interface RequestConfig<R> {
    baseUrl?: string
    url: string
    method?: Method
    query?: {[name: string]: any}
    data?: any
    parseResponse?(data: any): R
}

interface QueryParser<Q> { parseQuery?(query: Q): any }
interface DataParser<T> { parseData?(data: T): any }
interface ResponseParser<R> { parseResponse?(data: any): R }

type URLParser<P> = (path: P) => string

export interface HttpInstanceConfig {
    /**
     * instance请求的baseUrl。
     */
    baseUrl?: string
    /**
     * instance请求时的bearer token。自动附加到header。
     */
    token?: string
    /**
     * 拦截请求的错误并进行处理。
     * @return 返回错误，令错误继续返回，或返回undefined，拦截错误并报告一个空返回信息。
     */
    handleError?(e: ResponseError | ResponseConnectionError): ResponseError | ResponseConnectionError | undefined
}

export function createHttpInstance(config: Readonly<HttpInstanceConfig>): HttpInstance {
    const instance = axios.create()

    const headers = computed(() => config.token && {'Authorization': `Bearer ${config.token}`})

    function request<R>(requestConfig: RequestConfig<R>): Promise<Response<R>> {
        return new Promise(resolve => {
            instance.request({
                baseURL: requestConfig.baseUrl,
                url: requestConfig.url,
                method: requestConfig.method,
                params: requestConfig.query,
                data: requestConfig.data,
                headers: headers.value
            })
            .then(res => resolve({
                ok: true,
                status: res.status,
                data: res.data
            }))
            .catch((reason: AxiosError) => {
                let error: ResponseError | ResponseConnectionError
                if(reason.response) {
                    if(typeof reason.response.data === "object") {
                        const data = <{code: string, message: string, info: unknown}>reason.response.data
                        error = {
                            ok: false,
                            exception: <HttpException>{
                                status: reason.response.status,
                                code: data.code,
                                message: data.message,
                                info: data.info,
                            }
                        }
                    }else{
                        error = {
                            ok: false,
                            exception: {
                                status: reason.response.status,
                                code: "UNKNOWN_ERROR",
                                message: reason.response.data,
                                info: null
                            }
                        }
                    }
                }else{
                    error = {
                        ok: false,
                        message: reason.message
                    }
                }
                resolve(config.handleError ? config.handleError(error) ?? {ok: undefined} : error)
            })
        })
    }

    return {
        request,
        createPathQueryRequest: <P, Q, R>(url: URLParser<P>, method?: Method, parser?: QueryParser<Q> & ResponseParser<R>) => (path: P, query: Q) =>
            request<R>({baseUrl: config.baseUrl, url: url(path), method, query: parser?.parseQuery ? parser.parseQuery(query) : query, parseResponse: parser?.parseResponse}),
        createPathDataRequest: <P, T, R>(url: URLParser<P>, method?: Method, parser?: DataParser<T> & ResponseParser<R>) => (path: P, data: T) =>
            request<R>({baseUrl: config.baseUrl, url: url(path), method, data: parser?.parseData ? parser.parseData(data) : data, parseResponse: parser?.parseResponse}),
        createPathRequest: <P, R>(url: URLParser<P>, method?: Method, parser?: ResponseParser<R>) => (path: P) =>
            request<R>({baseUrl: config.baseUrl, url: url(path), method, parseResponse: parser?.parseResponse}),
        createQueryRequest: <Q, R>(url: string, method?: Method, parser?: QueryParser<Q> & ResponseParser<R>) => (query: Q) =>
            request<R>({baseUrl: config.baseUrl, url, method, query: parser?.parseQuery ? parser.parseQuery(query) : query, parseResponse: parser?.parseResponse}),
        createDataRequest: <T, R>(url: string, method?: Method, parser?: DataParser<T> & ResponseParser<R>) => (data: T) =>
            request<R>({baseUrl: config.baseUrl, url, method, data: parser?.parseData ? parser.parseData(data) : data, parseResponse: parser?.parseResponse}),
        createRequest: <R>(url: string, method?: Method, parser?: ResponseParser<R>) => () =>
            request<R>({baseUrl: config.baseUrl, url, method, parseResponse: parser?.parseResponse})
    }
}

/**
 * http请求返回的结果。根据情景不同，会被解析成不同的形态。
 */
export type Response<T> = ResponseOk<T> | ResponseError | ResponseConnectionError | ResponseEmpty

/**
 * 请求成功，获得了结果数据。
 */
export interface ResponseOk<T> {
    ok: true
    status: number
    data: T
}

/**
 * 服务器报告了业务错误。
 */
export interface ResponseError {
    ok: false
    exception: HttpException
}

/**
 * 发生了连接错误。一般情况下应该拦截此错误，而不是在返回时处理。
 */
export interface ResponseConnectionError {
    ok: false
    exception?: undefined
    message: string
}

/**
 * 错误信息已经被预处理拦截。因此不需要处理。
 */
export interface ResponseEmpty {
    ok: undefined
    exception?: undefined
}
