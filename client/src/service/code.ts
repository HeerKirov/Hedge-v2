export type StatusCode = "OK"   //没有异常
    | "NO_THIS_CHANNEL"     //路由未找到
    | "NOT_FOUND"           //资源未找到
    | "INTERNAL_ERROR"      //未捕获的内部错误
    | "VALIDATE_ERROR"      //参数校验错误
