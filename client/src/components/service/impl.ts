import { systemPreferences } from "electron"
import { Platform } from "../../utils/process"
import { AppDataDriver, AppDataStatus } from "../appdata"
import { ResourceManager } from "../resource"
import { ServerManager } from "../server"
import { StateManager } from "../state"
import { Bucket } from "../bucket"
import { Channel } from "../channel"
import { WindowManager } from "../../application/window-manager"
import {
    ActionResponse,
    AppInitForm,
    AppLoginForm, NewWindowForm,
    ServerInitForm,
    Service,
    SettingAuthForm,
    SettingChannelForm
} from "./index"

export interface ServiceOptions {
    platform: Platform
    userDataPath: string
    debugMode: boolean
    channel: string
}

export function createService(appdata: AppDataDriver, resource: ResourceManager, server: ServerManager, bucket: Bucket, state: StateManager, window: WindowManager, channel: Channel, options: ServiceOptions): Service {
    return {
        app: {
            env() {
                return {
                    platform: options.platform,
                    debugMode: options.debugMode,
                    userDataPath: options.userDataPath,
                    channel: options.channel,
                    canPromptTouchID: systemPreferences.canPromptTouchID()
                }
            },
            async init(form: AppInitForm): Promise<ActionResponse> {
                if(appdata.status() != AppDataStatus.NOT_INIT) {
                    return {ok: false, errorCode: "ALREADY_INIT"}
                }
                try {
                    await appdata.init()

                    await appdata.saveAppData(d => {
                        d.loginOption.password = form.password
                    })
                }catch (e) {
                    if(e instanceof Error) {
                        return {ok: false, errorCode: "INIT_ERROR", errorMessage: e.message}
                    }else{
                        return {ok: false, errorCode: "INIT_ERROR", errorMessage: e}
                    }
                }

                state.login(form.password ?? undefined)

                return {ok: true}
            },
            async login(form: AppLoginForm) {
                return {ok: state.login(form.password)}
            },
            async loginByTouchID() {
                return {ok: await state.loginByTouchID()}
            },
            status() {
                return {
                    status: appdata.status(),
                    isLogin: state.isLogin()
                }
            }
        },
        resource: {
            cli: {
                status() {
                    return {status: resource.getCliStatus()}
                },
                async update(): Promise<ActionResponse> {
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
            server: {
                status() {
                    return {status: resource.status()}
                },
                async update(): Promise<ActionResponse> {
                    try {
                        await resource.update()
                    }catch (e) {
                        if(e instanceof Error) {
                            return {ok: false, errorCode: "UPDATE_ERROR", errorMessage: e.message}
                        }else{
                            return {ok: false, errorCode: "UPDATE_ERROR", errorMessage: e}
                        }
                    }
                    return {ok: true}
                }
            }
        },
        server: {
            async env() {
                return server.connectionInfo()!
            },
            async open(): Promise<ActionResponse> {
                try {
                    await server.startConnection()
                }catch (e) {
                    if(e instanceof Error) {
                        return {ok: false, errorCode: "SERVER_ERROR", errorMessage: e.message}
                    }else{
                        return {ok: false, errorCode: "SERVER_ERROR", errorMessage: e}
                    }
                }
                return {ok: true}
            },
            async close(): Promise<ActionResponse> {
                try {
                    await server.closeConnection()
                }catch (e) {
                    if(e instanceof Error) {
                        return {ok: false, errorCode: "SERVER_ERROR", errorMessage: e.message}
                    }else{
                        return {ok: false, errorCode: "SERVER_ERROR", errorMessage: e}
                    }
                }
                return {ok: true}
            },
            status() {
                return {status: server.status()}
            },
            async init(form: ServerInitForm): Promise<ActionResponse> {
                try {
                    await server.initializeRemoteServer(form.dbPath)
                }catch (e) {
                    if(e instanceof Error) {
                        return {ok: false, errorCode: "SERVER_ERROR", errorMessage: e.message}
                    }else{
                        return {ok: false, errorCode: "SERVER_ERROR", errorMessage: e}
                    }
                }
                return {ok: true}

            }
        },
        setting: {
            auth: {
                get() {
                    return appdata.getAppData().loginOption
                },
                async set(form: SettingAuthForm) {
                    const data = await appdata.saveAppData(data => {
                        if(form.password !== undefined) data.loginOption.password = form.password
                        if(form.touchID !== undefined) data.loginOption.touchID = form.touchID
                    })
                    return data.loginOption
                }
            },
            channel: {
                change(form: SettingChannelForm) {
                    channel.restartWithChannel(form.channel)
                },
                async list() {
                    return {
                        channels: await channel.getChannelList()
                    }
                },
                async setDefault(form: SettingChannelForm) {
                    await channel.setDefaultChannel(form.channel)
                }
            }
        },
        window: {
            async openNewWindow(form?: NewWindowForm): Promise<void> {
                window.createWindow(form?.routeName, form?.routeParam)
            },
            async openSetting(): Promise<void> {
                window.openSettingWindow()
            },
            async openGuide(): Promise<void> {
                window.openGuideWindow()
            }
        }
    }
}
