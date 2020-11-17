import { systemPreferences } from "electron"
import { Platform } from "../../utils/process"
import { AppDataDriver, AppDataStatus } from "../appdata"
import { ResourceManager } from "../resource"
import { ServerManager } from "../server"
import { StateManager } from "../state"
import { Bucket } from "../bucket"
import {
    AppInitForm,
    AppLoginForm,
    ServerInitForm,
    Service,
    SettingAuthForm,
    SettingChannelForm,
    StorageGetForm,
    StorageSetForm
} from "./index"

export interface ServiceOptions {
    platform: Platform
    userDataPath: string
    debugMode: boolean
    channel: string
}

export function createService(appdata: AppDataDriver, resource: ResourceManager, server: ServerManager, bucket: Bucket, state: StateManager, options: ServiceOptions): Service {
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
            async init(form: AppInitForm) {
                if(appdata.status() != AppDataStatus.NOT_INIT) {
                    return {ok: false}
                }
                await appdata.init()

                await appdata.saveAppData(d => {
                    d.loginOption.password = form.password
                })

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
                async status() {
                    return {status: resource.getCliStatus()}
                },
                async update() {
                    await resource.updateCli()
                }
            },
            server: {
                async status() {
                    return {status: resource.status()}
                },
                async update() {
                    await resource.update()
                }
            }
        },
        server: {
            async close() {
                await server.closeConnection()
                return {status: server.status()}
            },
            async env() {
                return server.connectionInfo()!
            },
            async open() {
                await server.startConnection()
                return {status: server.status()}
            },
            async status() {
                return {status: server.status()}
            },
            async init(form: ServerInitForm) {
                await server.initializeRemoteServer(form.dbPath)
            }
        },
        setting: {
            auth: {
                get: function () {
                    throw new Error("Not Implemented")
                }, set: function (p1: SettingAuthForm) {
                    throw new Error("Not Implemented")
                }
            },
            channel: {
                change: function (p1: SettingChannelForm) {
                    throw new Error("Not Implemented")
                }, list: function () {
                    throw new Error("Not Implemented")
                }, setDefault: function (p1: SettingChannelForm) {
                    throw new Error("Not Implemented")
                }
            }
        },
        storage: {
            async get(form: StorageGetForm) {
                return bucket.storage(form.key).read()
            },
            async set(form: StorageSetForm) {
                bucket.storage(form.key).write(form.content)
            }
        }

    }
}
