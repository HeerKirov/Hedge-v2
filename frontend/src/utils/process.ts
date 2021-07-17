
export type OSName = "win32" | "darwin" | "linux" | "others"

/**
 * 取得前端当前运行平台的名称。
 */
export function getOSName(): OSName {
    const userAgent = navigator.userAgent

    if(userAgent.indexOf("Mac OS X") > 0 || userAgent.indexOf("Macintosh") > 0) {
        return "darwin"
    }else if(userAgent.indexOf("Linux") > 0) {
        return "linux"
    }else if(userAgent.indexOf("Windows") > 0 || userAgent.indexOf("win32") > 0 || userAgent.indexOf("win64") > 0 || userAgent.indexOf("wow32") > 0 || userAgent.indexOf("wow64") > 0) {
        return "win32"
    }else{
        return "others"
    }
}

/**
 * 线程睡眠一段时间。
 * @param timeMs
 */
export async function sleep(timeMs: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, timeMs))
}
