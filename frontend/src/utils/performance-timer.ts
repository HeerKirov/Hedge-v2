/**
 * 性能测试计时器。
 */
export interface PerformanceTimer {
    logInterval(message: string)
    logTotal(message: string)
}

export function performanceTimer(): PerformanceTimer {
    const beginTime = new Date().getTime()
    let lastTime = beginTime

    return {
        logInterval(message: string) {
            const now = new Date().getTime()
            console.log(`${message}: time cost ${now - lastTime}ms`)
            lastTime = now
        },
        logTotal(message: string) {
            const now = new Date().getTime()
            console.log(`${message}: total cost ${now - beginTime}ms`)
        }
    }
}