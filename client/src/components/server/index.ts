import path from "path"
import { DATA_FILE, RESOURCE_FILE } from "../../definitions/file"
import { ServerStatus } from "./model"

/**
 * 对接后台服务部分的管理器。负责监视本频道对应的后台服务的运行状态，获取其运行参数，提供启动后台服务的功能，提供部分必须的后台服务功能接入。
 */
export interface ServerManager {
    /**
     * 尝试启动后台服务进程。
     * - 如果服务已在运行，跳过启动步骤。
     * - 如果服务启动出错，那么返回相关的异常。
     * - 每隔一段时间刷新后台服务进程的持续时间，防止其自动关闭。后台服务使用注册心跳的机制来维持其后台运行并在空闲时关闭。
     */
    start(): Promise<ServerStatus>
    /**
     * 获得当前后台服务进程的运行状态。如果此前没有启动过，那么会尝试读取现有的后台服务进程状态。
     */
    status(): Promise<ServerStatus>
}

/**
 * 启动参数。
 */
interface ServerManagerOptions {
    /**
     * app数据目录。
     */
    userDataPath: string
    /**
     * app频道。
     */
    channel: string
    /**
     * 在调试模式运行。
     */
    debug?: {
        /**
         * 使用此URL提供的后台服务，用于后台业务开发。此时后台服务启动管理的功能大部分被禁用。
         */
        serverFromURL?: string
        /**
         * 使用此文件夹下的后台服务，用于管理器的调试。此时不从userData目录下寻找后台服务程序。
         */
        serverFromFolder?: string
    }
}

export function createServerManager(options: ServerManagerOptions): ServerManager {
    if(options.debug?.serverFromURL) {
        return createProxyServerManager(options)
    }

    const debugMode = !!options.debug
    const serverBinPath = options.debug?.serverFromFolder
        ? path.join(options.debug?.serverFromFolder, RESOURCE_FILE.SERVER.BIN)
        : path.join(options.userDataPath, DATA_FILE.RESOURCE.SERVER_FOLDER, RESOURCE_FILE.SERVER.BIN)
    const serverPIDPath = path.join(options.userDataPath, DATA_FILE.APPDATA.CHANNEL_FOLDER(options.channel), DATA_FILE.APPDATA.CHANNEL.SERVER_PID)

    async function start(): Promise<ServerStatus> {
        throw "TODO"
    }

    async function status(): Promise<ServerStatus> {
        throw "TODO"
    }

    return {
        start,
        status
    }
}

function createProxyServerManager(options: ServerManagerOptions): ServerManager {
    const status: ServerStatus = {ok: true, host: options.debug!.serverFromURL!!, token: ""}

    return {
        async start(): Promise<ServerStatus> {
            return status
        },
        async status(): Promise<ServerStatus> {
            return status
        }
    }
}
