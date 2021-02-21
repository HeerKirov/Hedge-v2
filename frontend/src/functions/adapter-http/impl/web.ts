import { HttpClient, Response } from "../server"

export interface WebEndpoint {
    access(): Promise<Response<AccessResponse>>
    login(form: LoginForm): Promise<Response<TokenForm>>
    tokenVerify(form: TokenForm): Promise<Response<TokenResponse>>
}

export function createWebEndpoint(http: HttpClient): WebEndpoint {
    return {
        access: http.createRequest<AccessResponse>("/web/access"),
        login: http.createDataRequest<LoginForm, TokenForm>("/web/login", "POST"),
        tokenVerify: http.createDataRequest<TokenForm, TokenResponse>("/web/token-verify", "POST")
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