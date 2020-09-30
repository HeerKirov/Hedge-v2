/**
 * 内存中的服务状态存储器。
 */
export interface State {
    isLogin: boolean
}

export function createState(): State {
    return {
        isLogin: false
    }
}
