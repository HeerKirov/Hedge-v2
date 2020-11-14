import path from "path"
import { request } from "http"
import { spawn } from "child_process"
import { DATA_FILE, RESOURCE_FILE } from "../../definitions/file"
import { ServerConnectionInfo, ServerPID, ServerStatus } from "./model"
import { readFile } from "../../utils/fs"
import { sleep } from "../../utils/process"

/**
 * 对接后台服务部分的管理器。负责监视本频道对应的后台服务的运行状态，获取其运行参数，提供启动后台服务的功能，提供部分必须的后台服务功能接入。
 */
export interface ServerManager {
    /**
     * 尝试启动后台服务进程并连接。
     * - 检查server是否已在运行，如果没有在运行，启动server。
     * - 随后快速轮询server.pid和server，直到server可用。
     * - 最后开启后台的轮询服务，维持心跳并检查server状态。
     */
    startConnection(): Promise<ServerConnectionInfo>

    /**
     * 获得当前运行状态。
     */
    status(): ServerStatus

    /**
     * 获得连接信息。
     */
    connectionInfo(): ServerConnectionInfo | null

    /**
     * 尝试关闭客户端连接。
     * - 关闭后台轮询服务，停止心跳。
     * - 通知server删除当前client的lifetime。
     */
    closeConnection(): Promise<void>
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
        /**
         * 使用此文件夹下的前端资源。用于前端的调试。
         */
        frontendFromFolder?: string
    }
}

export function createServerManager(options: ServerManagerOptions): ServerManager {
    if(options.debug?.serverFromURL) {
        return createProxyServerManager(options)
    }else{
        return createStdServerManager(options)
    }
}

function createProxyServerManager(options: ServerManagerOptions): ServerManager {
    const info = {url: options.debug!.serverFromURL!!, token: ""}

    return {
        async startConnection(): Promise<ServerConnectionInfo> {
            return info
        },
        status(): ServerStatus {
            return ServerStatus.OPEN
        },
        connectionInfo(): ServerConnectionInfo {
            return info
        },
        async closeConnection(): Promise<void> {}
    }
}

function createStdServerManager(options: ServerManagerOptions): ServerManager {
    const debugMode = !!options.debug
    const serverBinPath = options.debug?.serverFromFolder
        ? path.join(options.debug?.serverFromFolder, RESOURCE_FILE.SERVER.BIN)
        : path.join(options.userDataPath, DATA_FILE.RESOURCE.SERVER_FOLDER, RESOURCE_FILE.SERVER.BIN)
    const serverPIDPath = path.join(options.userDataPath, DATA_FILE.APPDATA.CHANNEL_FOLDER(options.channel), DATA_FILE.APPDATA.CHANNEL.SERVER_PID)

    let status: ServerStatus = ServerStatus.UNKNOWN
    let connectionInfo: ServerConnectionInfo | null = null

    /**
     * 调用spawn创建进程。
     */
    async function callSpawn(): Promise<void> {
        const baseArgs = ['--channel', options.channel, '--user-data', options.userDataPath]
        const debugModeArgs = debugMode ? ['--debug-mode'] : []
        const frontendFromFolderArgs = options.debug?.frontendFromFolder ? ['--frontend-from-folder', options.debug.frontendFromFolder] : []
        spawn(serverBinPath, [...baseArgs, ...debugModeArgs, ...frontendFromFolderArgs], {detached: true})
    }

    /**
     * 检查server服务是否可用(方式是调/health接口检查是否已经可以走通)。
     * @return 如果已经可用，返回true；还不可用则返回false。
     * @throws 如果访问产生401/403，视为无法解决的致命错误，抛出一个Error。
     */
    async function checkForHealth(url: string, token: string): Promise<boolean> {
        return new Promise((resolve, reject) => {
            request(`${url}/app/health`, {method: 'GET', headers: {'Authorization': `bearer ${token}`}}, res => {
                if(res.statusCode != undefined && res.statusCode < 300) {
                    resolve(true)
                }else if(res.statusCode == undefined) {
                    resolve(false)
                }else if(res.statusCode == 401 || res.statusCode == 403) {
                    reject(new Error(`Access is forbidden(status code is ${res.statusCode}).`))
                }
            })
        })
    }
    /**TODO 设计不对。error这个东西到底该如何处理？
     *      应该把errors从server.pid里剥离出去，使其不再负责errors传递。
     *      errors都写入本地另外的log文件中，根据需要读取。
     */

    /**
     * 查询serverPID文件以及端口是否可用。
     * @return 如果可用，返回url和token；如果存在致命错误，抛出一个string异常。
     * @throws 如果token不对，视为无法解决的致命错误，抛出一个Error。
     */
    async function checkForAvailable(): Promise<{url: string, token: string} | null> {
        const serverPID = await readFile<ServerPID>(serverPIDPath)
        if(serverPID != null) {
            if(serverPID.port != null && serverPID.token != null) {
                const url = `http://127.0.0.1:${serverPID.port}`
                const token = serverPID.token
                if(await checkForHealth(url, token)) {
                    return {url, token}
                }else{
                    return null
                }
            }else if(serverPID.errors != null) {
                throw serverPID.errors.join("\n")
            }else{
                return null
            }
        }else{
            return null
        }
    }

    /**
     * 等待，直到server可用。如果等待时间过长，会抛出一个string异常。
     */
    async function waitForReady(): Promise<{url: string, token: string}> {
        for(let i = 0; i < 10; ++i) {
            await sleep(i <= 1 ? 250 : 1000)
            const result = await checkForAvailable()
            if(result != null) {
                return result
            }
        }
        throw "Waiting for server starting over 10s."
    }

    async function startConnection(): Promise<ServerConnectionInfo> {
        const serverPID = await readFile<ServerPID>(serverPIDPath)
        if(serverPID == null) {
            await callSpawn()
        }

        await waitForReady()

        return connectionInfo!
    }

    async function closeConnection(): Promise<void> {

    }

    return {
        startConnection,
        closeConnection,
        status(): ServerStatus {
            return status
        },
        connectionInfo(): ServerConnectionInfo | null {
            return connectionInfo
        }
    }
}
