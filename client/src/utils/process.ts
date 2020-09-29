export type Platform = "win32" | "darwin" | "linux"

export function getElectronPlatform(): Platform {
    const platform = process.platform
    if(platform === "win32" || platform === "darwin" || platform === "linux") {
        return platform
    }
    throw new Error(`Unsupported platform ${platform}.`)
}
