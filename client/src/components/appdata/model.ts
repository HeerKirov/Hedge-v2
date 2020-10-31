export interface AppData {
    version: string
    loginOption: LoginOption
}

interface LoginOption {
    password: string | null
    touchID: boolean
}

export function defaultValue(): AppData {
    return {
        version: "0.0.0",
        loginOption: {
            password: null,
            touchID: false
        }
    }
}
