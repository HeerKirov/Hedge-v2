export type Platform = "win32"|"darwin"|"linux"

export function getElectronPlatform(): Platform {
    const platform = process.platform
    if(platform === "win32" || platform === "darwin" || platform === "linux") {
        return platform
    }
    throw new Error(`Unsupported platform ${platform}.`)
}

export const APP_DATA_DIM = {
    FOLDER: "app",
    MAIN_STORAGE: "main.storage",
    PID: "server.PID"
}

export const FRONTEND_INDEX_DIM = "frontend/index.html"
