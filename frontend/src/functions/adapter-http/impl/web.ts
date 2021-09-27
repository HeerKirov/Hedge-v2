import { HttpInstance, Response } from "../server"
import { PasswordWrong } from "../exception"

export function createWebEndpoint(http: HttpInstance): WebEndpoint {
    return {
        access: http.createRequest("/web/access"),
        login: http.createDataRequest("/web/login", "POST"),
        verifyToken: http.createDataRequest("/web/verify-token", "POST")
    }
}

/**
 * 这一组API用于web mode下的基本连接处理。
 * @permission 访问这些API不需要任何权限。
 */
export interface WebEndpoint {
    /**
     * 询问服务器，当前是否允许web mode访问，以及访问是否需要密码。
     */
    access(): Promise<Response<AccessResponse>>
    /**
     * web mode登录。
     */
    login(form: LoginForm): Promise<Response<TokenForm, PasswordWrong>>
    /**
     * 验证一个web mode的token是否是有效的。
     * 因为token可以被存储到storage中下次使用，因此下次使用之前要先确定它仍然是有效的。
     */
    verifyToken(form: TokenForm): Promise<Response<TokenResponse>>
}

export interface LoginForm {
    /**
     * 登录密码。
     */
    password: string
}

export interface TokenForm {
    /**
     * 要验证的token。
     */
    token: string
}

export interface AccessResponse {
    /**
     * 是否允许web mode访问。
     */
    access: boolean
    /**
     * 访问是否要求密码。如果不要求密码，则不需要附带token即可访问API。
     */
    needPassword: boolean
}

export interface TokenResponse {
    /**
     * token是否仍可用。
     */
    ok: boolean
}
