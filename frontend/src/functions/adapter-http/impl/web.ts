import { HttpInstance, Response } from "../server"

export interface WebEndpoint {
    access(): Promise<Response<AccessResponse>>
    login(form: LoginForm): Promise<Response<TokenForm>>
    tokenVerify(form: TokenForm): Promise<Response<TokenResponse>>
}

export function createWebEndpoint(http: HttpInstance): WebEndpoint {
    return {
        access: http.createRequest("/web/access"),
        login: http.createDataRequest("/web/login", "POST"),
        tokenVerify: http.createDataRequest("/web/token-verify", "POST")
    }
}

export interface LoginForm {
    password: string
}

export interface TokenForm {
    token: string
}

export interface AccessResponse {
    access: boolean
    needPassword: boolean
}

export interface TokenResponse {
    ok: boolean
}