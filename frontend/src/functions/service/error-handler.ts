import { ResponseConnectionError, ResponseError } from "@/functions/adapter-http"

export function useErrorHandler(throwError: (title: string, message: string) => void) {
    function processHttpClientError(e: ResponseError | ResponseConnectionError): ResponseError | ResponseConnectionError | undefined {
        if(e.exception) {
            const exception = e.exception
            if(exception.code === "NOT_INIT") {
                throwError("Not Initialized", "错误: 服务未被初始化，访问连接无法建立")
            }else if(exception.code === "NO_TOKEN") {
                throwError("Connection Error", "未持有服务访问token，因此连接被拒绝")
            }else if(exception.code === "TOKEN_WRONG") {
                throwError("Connection Error", "持有的token错误，因此连接被拒绝")
            }else if(exception.code === "ONLY_FOR_CLIENT") {
                throwError("Forbidden", "调用了仅提供给client mode的功能接口")
            }else if(exception.code === "ONLY_FOR_WEB") {
                throwError("Forbidden", "调用了仅提供给web mode的功能接口")
            }else if(exception.code === "REMOTE_DISABLED") {
                throwError("Forbidden", "尝试使用client mode的token执行远程连接，因此连接被拒绝")
            }else{
                return e
            }
            return undefined
        }else{
            throwError("服务连接失败", e.message)
            return undefined
        }
    }

    return {processHttpClientError}
}