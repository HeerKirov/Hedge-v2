import { app, BrowserWindow } from "electron"

export interface AppOptions {
    developmentMode?: boolean
    developmentFrontendURL?: string
}

export function createApplication(options?: AppOptions) {

    app.on('window-all-closed', () => {
        if (process.platform !== 'darwin') {
            app.quit()
        }
    })

    app.on('activate', async () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            await createWindow()
        }
    })

    app.whenReady().then(async () => {
        await createWindow()
    })

    async function createWindow() {
        const win = new BrowserWindow({
            title: 'Hedge',
            minHeight: 480,
            minWidth: 640,
            titleBarStyle: "hiddenInset",
            webPreferences: {
                devTools: !!options?.developmentMode,
                nodeIntegration: true,
                //preload: '' 注入启动脚本
            }
        })

        if(options?.developmentMode) {
            if(options?.developmentFrontendURL) {
                await win.loadURL(options.developmentFrontendURL)
            }else{
                await win.loadFile("../frontend/dist/index.html")
            }
        }else{
            await win.loadFile("../frontend/index.html")
        }
    }
}


