import path from "path"
import { spawn } from "child_process"
import axios, { AxiosRequestConfig } from "axios"
import { DATA_FILE, RESOURCE_FILE } from "../../definitions/file"
import { ServerConnectionInfo, ServerPID, ServerStatus } from "./model"
import { readFile } from "../../utils/fs"
import { sleep, schedule, Future } from "../../utils/process"

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

    /**
     * 对server进行初始化。
     * @param dbPath 初始化的数据库文件夹路径
     * @return 指示是否成功初始化。如果初始化过，执行此方法会失败并返回false。
     */
    initializeRemoteServer(dbPath: string): Promise<boolean>
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
    const info = {pid: 0 ,url: options.debug!.serverFromURL!!, token: ""}

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
        async closeConnection(): Promise<void> {},
        async initializeRemoteServer(): Promise<boolean> {
            return true
        }
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

    let lifetimeId: string | null = null
    let scheduleFuture: Future | null = null

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
     * 等待，直到server可用。如果等待时间过长，会抛出一个异常。
     */
    async function waitForReady(): Promise<ServerConnectionInfo> {
        for(let i = 0; i < 30; ++i) {
            await sleep(i <= 1 ? 250 : 1000)
            const result = await checkForAvailable(serverPIDPath)
            if(result != null) {
                return result
            }
        }
        throw new Error("Waiting for server starting over 30s.")
    }

    /**
     * 尝试启动并创建心跳任务。
     */
    async function startConnection(): Promise<ServerConnectionInfo> {
        const serverPID = await readFile<ServerPID>(serverPIDPath)
        if(serverPID == null) {
            await callSpawn()
        }

        connectionInfo = await waitForReady()

        {
            const res = await request({url: `${connectionInfo!.url}/app/lifetime`, method: "post", headers: {'Authorization': `bearer ${connectionInfo!.token}`}, data: {interval: 1000 * 120}})
            if(res.ok) {
                lifetimeId = (<{id: string}>res.data).id
            }else{
                throw new Error(`Error occurred in creating heart in server: ${res.message}`)
            }
        }

        scheduleFuture = schedule(1000 * 40, async () => {
            const res = await request({url: `${connectionInfo!.url}/app/lifetime/${lifetimeId!}`, method: "put", headers: {'Authorization': `bearer ${connectionInfo!.token}`}})
            if(!res.ok) {
                console.error(`Error occurred in heart to server: ${res.message}`)
            }
        })

        return connectionInfo
    }

    /**
     * 停止心跳任务并关闭连接。
     */
    async function closeConnection(): Promise<void> {
        if(scheduleFuture != null) {
            scheduleFuture.stop()
            scheduleFuture = null
        }

        {
            const res = await request({url: `${connectionInfo!.url}/app/lifetime/${lifetimeId!}`, method: "delete", headers: {'Authorization': `bearer ${connectionInfo!.token}`}})
            if(!res.ok) {
                console.error(`Error occurred in deleting heart from server: ${res.message}`)
            }
            lifetimeId = null
        }
    }

    /**
     * 初始化server。
     */
    async function initializeRemoteServer(dbPath: string): Promise<boolean> {
        const res = await request({url: `${connectionInfo?.url!}/app/init`, method: "post", headers: {'Authorization': `bearer ${connectionInfo!.token}`}, data: {dbPath}})
        if(res.ok) {
            return true
        }else if(res.status) {
            if(res.code === "REJECT") {
                return false
            }else{
                throw new Error(`Initialization error [${res.code}]: ${res.message}`)
            }
        }else{
            throw new Error(`Error occurred while initializing server: ${res.message}`)
        }
    }

    return {
        startConnection,
        closeConnection,
        initializeRemoteServer,
        status(): ServerStatus {
            return status
        },
        connectionInfo(): ServerConnectionInfo | null {
            return connectionInfo
        }
    }
}

/**
 * 检查server服务是否可用(方式是调/health接口检查是否已经可以走通)。
 * @return 如果已经可用，返回true；还不可用则返回false。
 * @throws 如果访问产生401/403，视为无法解决的致命错误，抛出一个Error。
 */
async function checkForHealth(url: string, token: string): Promise<boolean> {
    const res = await request({url: `${url}/app/health`, method: 'GET', headers: {'Authorization': `bearer ${token}`}})
    if(res.ok) {
        return true
    }else if(res.status) {
        throw new Error(`Unexpected status ${res.status} in health check: ${res.message}`)
    }else{
        return false
    }
}

/**
 * 查询serverPID文件以及端口是否可用。
 * @return 如果可用，返回pid、url和token；如果存在致命错误，抛出一个string异常。
 * @throws 如果token不对，视为无法解决的致命错误，抛出一个Error。
 */
async function checkForAvailable(pidPath: string): Promise<ServerConnectionInfo | null> {
    const serverPID = await readFile<ServerPID>(pidPath)
    if(serverPID != null) {
        if(serverPID.port != null && serverPID.token != null) {
            const pid = serverPID.pid
            const url = `http://127.0.0.1:${serverPID.port}`
            const token = serverPID.token
            if(await checkForHealth(url, token)) {
                return {pid, url, token}
            }
        }
    }
    return null
}

/**
 * 发送一个http请求。包装过axios方法，处理其异常。
 */
function request<T>(config: AxiosRequestConfig): Promise<Response<T>> {
    return new Promise(resolve => {
        axios.request(config)
            .then(res => {
                resolve({
                    ok: true,
                    status: res.status,
                    data: res.data
                })
            }).catch(reason => {
                if(reason.response) {
                    const data = reason.response.data as {code: string, message: string | null, info: any}
                    resolve({
                        ok: false,
                        status: reason.response.status,
                        code: data.code,
                        message: data.message
                    })
                }else{
                    resolve({
                        ok: false,
                        status: undefined,
                        message: reason.message
                    })
                }
            })
    })
}

type Response<T> = ResponseOk<T> | ResponseError | ResponseConnectionError

interface ResponseOk<T> {
    ok: true
    status: number
    data: T
}

interface ResponseError {
    ok: false
    status: number
    code: string
    message: string | null
}

interface ResponseConnectionError {
    ok: false
    status: undefined
    message: string
}
