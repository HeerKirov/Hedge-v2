export type Platform = "win32" | "darwin" | "linux"

export function getNodePlatform(): Platform {
    const platform = process.platform
    if(platform === "win32" || platform === "darwin" || platform === "linux") {
        return platform
    }
    throw new Error(`Unsupported platform ${platform}.`)
}

export async function promiseAll(...promises: Promise<void>[]): Promise<void> {
    for (let promise of promises) {
        await promise
    }
}

/**
 * 线程睡眠一段时间。
 * @param timeMs
 */
export async function sleep(timeMs: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, timeMs))
}

/**
 * 启动一个异步的计划任务，每隔一定的时间就自动运行一次。
 * 执行此方法时，task不会立即执行，而是先等待第一轮间隔。
 * @param intervalMs 间隔时间，单位毫秒
 * @param task 自动运行的函数
 */
export function schedule(intervalMs: number, task: (future: Future) => Promise<void>): Future {
    let running = true

    function stop() {
        running = false
    }

    async function run() {
        await sleep(intervalMs)
        while (running) {
            try {
                await task({stop})
            }catch (e) {
                console.log(e)
            }
            await sleep(intervalMs)
        }
    }

    run().catch(reason => console.log(reason))

    return {stop}
}

/**
 * 异步计划任务的上下文。
 */
export interface Future {
    /**
     * 停止此schedule计划。
     */
    stop(): void
}
