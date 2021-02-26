import { HttpInstance, Response } from "../server"

export function createSettingProxyEndpoint(http: HttpInstance): SettingProxyEndpoint {
    return {
        get: http.createRequest("/api/setting/proxy"),
        update: http.createDataRequest("/api/setting/proxy", "PATCH")
    }
}

/**
 * 设置：代理相关的选项。
 * @permission only client
 */
export interface SettingProxyEndpoint {
    /**
     * 查看。
     */
    get(): Promise<Response<ProxyOption>>
    /**
     * 更改。
     */
    update(form: ProxyOptionUpdateForm): Promise<Response<unknown>>
}

export interface ProxyOption {
    /**
     * socks5代理地址。
     */
    socks5Proxy: string | null
    /**
     * http代理地址。
     */
    httpProxy: string | null
}

export interface ProxyOptionUpdateForm {
    socks5Proxy?: string | null
    httpProxy?: string | null
}