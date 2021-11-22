import { app, Menu } from "electron"
import { WindowManager } from "./window-manager"
import { Platform } from "../utils/process"

export function registerDockMenu(windowManager: WindowManager, options: {platform: Platform}) {
    if(options.platform === "darwin") {
        app.dock.setMenu(Menu.buildFromTemplate([
            {label: "新建窗口", click() { windowManager.createWindow() }}
        ]))
    }
}
