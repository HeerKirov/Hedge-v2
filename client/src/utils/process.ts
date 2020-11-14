export type Platform = "win32" | "darwin" | "linux"

export function getNodePlatform(): Platform {
    const platform = process.platform
    if(platform === "win32" || platform === "darwin" || platform === "linux") {
        return platform
    }
    throw new Error(`Unsupported platform ${platform}.`)
}

export async function sleep(timeMs: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, timeMs))
}
