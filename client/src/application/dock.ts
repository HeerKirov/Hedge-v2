import { app, Menu } from "electron"
import { WindowManager } from "./window-manager"

export function registerDockMenu(windowManager: WindowManager) {
    app.dock.setMenu(Menu.buildFromTemplate([
        {label: "新建窗口", click() { windowManager.createWindow() }}
    ]))
}
