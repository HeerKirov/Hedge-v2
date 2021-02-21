import { systemPreferences } from "electron"
import { Platform } from "../../utils/process"
import { AppDataDriver } from "../appdata"
import { ResourceManager } from "../resource"
import { ServerManager } from "../server"
import { InitConfig, StateManager } from "../state"
import { Channel } from "../channel"
import { WindowManager } from "../../application/window-manager"
import { ThemeManager } from "../../application/theme-manager"
import { ActionResult, AppearanceSetting, AuthSetting, NewWindowOptions, Service } from "./index"

export interface ServiceOptions {
    platform: Platform
    userDataPath: string
    debugMode: boolean
    channel: string
}

export function createService(appdata: AppDataDriver, channel: Channel, resource: ResourceManager, server: ServerManager, state: StateManager, window: WindowManager, themeManager: ThemeManager, options: ServiceOptions): Service {
    return {
        app: {
            env() {
                return {
                    platform: options.platform,
                    debugMode: options.debugMode,
                    userDataPath: options.userDataPath,
                    channel: options.channel,
                    canPromptTouchID: appdata.getAppData().loginOption.touchID && systemPreferences.canPromptTouchID(),
                    appState: state.state(),
                    connection: server.connectionInfo()
                }
            },
            async init(config: InitConfig) {
                state.init(config)
            },
            async login(password: string): Promise<boolean> {
                return state.login(password)
            },
            loginByTouchID: state.loginByTouchID,
            onStateChanged: state.onStateChanged,
            onInitStateChanged: state.onInitChanged
        },
        window: {
            async openNewWindow(form?: NewWindowOptions): Promise<void> {
                window.createWindow(form?.routeName, form?.routeParam)
            },
            async openSetting(): Promise<void> {
                window.openSettingWindow()
            },
            async openGuide(): Promise<void> {
                window.openGuideWindow()
            }
        },
        cli: {
            async status() {
                return resource.getCliStatus()
            },
            async update(): Promise<ActionResult> {
                try {
                    await resource.updateCli()
                }catch (e) {
                    if(e instanceof Error) {
                        return {ok: false, errorCode: "UPDATE_ERROR", errorMessage: e.message}
                    }else{
                        return {ok: false, errorCode: "UPDATE_ERROR", errorMessage: e}
                    }
                }
                return {ok: true}
            }
        },
        appearance: {
            async get() {
                return {theme: themeManager.getTheme()}
            },
            async set(value: AppearanceSetting) {
                await themeManager.setTheme(value.theme)
            }
        },
        auth: {
            async get() {
                return appdata.getAppData().loginOption
            },
            async set(value: AuthSetting) {
                await appdata.saveAppData(data => {
                    data.loginOption.password = value.password
                    data.loginOption.touchID = value.touchID
                    data.loginOption.fastboot = value.fastboot
                })
            }
        },
        channel: {
            change: channel.restartWithChannel,
            list: channel.getChannelList,
            setDefault: channel.setDefaultChannel
        }
    }
}
