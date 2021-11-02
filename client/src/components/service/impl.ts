import * as url from "url"
import { systemPreferences } from "electron"
import { Platform } from "../../utils/process"
import { getIPAddress } from "../../utils/net"
import { ClientException } from "../../exceptions"
import { AppDataDriver, AppDataStatus } from "../appdata"
import { ConfigurationDriver } from "../configuration"
import { ResourceManager } from "../resource"
import { ServerManager } from "../server"
import { Channel } from "../channel"
import { InitConfig, InitState, StateManager } from "../state"
import { WindowManager } from "../../application/window-manager"
import { ThemeManager } from "../../application/theme-manager"
import {
    ActionResult,
    AppearanceSetting,
    AuthSetting,
    InitStateRes,
    LoginRes,
    ServerInfo,
    Service
} from "./index"

export interface ServiceOptions {
    platform: Platform
    userDataPath: string
    debugMode: boolean
    channel: string
}

export function createService(appdata: AppDataDriver, configuration: ConfigurationDriver, channel: Channel, resource: ResourceManager, server: ServerManager, state: StateManager, window: WindowManager, themeManager: ThemeManager, options: ServiceOptions): Service {
    return {
        app: {
            env() {
                return {
                    platform: options.platform,
                    debugMode: options.debugMode,
                    userDataPath: options.userDataPath,
                    channel: options.channel,
                    canPromptTouchID: appdata.status() === AppDataStatus.LOADED && appdata.getAppData().loginOption.touchID && systemPreferences.canPromptTouchID(),
                    appState: state.state(),
                    connection: server.connectionInfo()
                }
            },
            async init(config: InitConfig): Promise<InitStateRes> {
                try {
                    const initState = await state.init(config)
                    return {state: initState}
                }catch (e) {
                    const { errorCode, errorMessage } = catchException(e)
                    return {state: InitState.ERROR, errorCode, errorMessage}
                }
            },
            async login(password: string): Promise<LoginRes> {
                return state.login(password)
            },
            loginByTouchID: state.loginByTouchID,
            onStateChanged: state.onStateChanged,
            onInitStateChanged(e) {
                state.onInitChanged((state, errorCode, errorMessage) => e({state, errorCode, errorMessage}))
            }
        },
        server: {
            async serverInfo(): Promise<ServerInfo> {
                const connectionInfo = server.connectionInfo()
                if(connectionInfo) {
                    const { protocol, port } = url.parse(connectionInfo.url)
                    return {
                        running: true,
                        pid: connectionInfo.pid,
                        port: port ? parseInt(port) : protocol === "https" ? 443 : 80,
                        startTime: connectionInfo.startTime
                    }
                }else{
                    return {running: false}
                }
            },
            async webAccessUrls(): Promise<string[]> {
                const serverUrl = server.connectionInfo()?.url
                if(serverUrl) {
                    const { protocol, port, path } = url.parse(serverUrl)
                    return getIPAddress().map(ip => `${protocol ?? "http:"}//${ip}:${port}${path}`)
                }
                return []
            }
        },
        window: {
            async openNewWindow(url?: string): Promise<void> {
                window.createWindow(url)
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
                    return {ok: true}
                }catch (e) {
                    return catchException(e)
                }
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
            getDefault: channel.getDefaultChannel,
            setDefault: channel.setDefaultChannel
        }
    }
}

function catchException(e: any): ActionResult {
    if(e instanceof ClientException) {
        return {ok: false, errorCode: e.code, errorMessage: getErrorMessage(e.e)}
    }else{
        return {ok: false, errorCode: "UNSPECIFIED_ERROR", errorMessage: getErrorMessage(e)}
    }
}

function getErrorMessage(e: any): string {
    if(e instanceof Error) {
        return e.message
    }else{
        return e?.toString() ?? ""
    }
}
