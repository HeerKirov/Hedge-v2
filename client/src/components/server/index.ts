import path from "path"
import { openSync } from "fs"
import { spawn } from "child_process"
import axios, { AxiosRequestConfig } from "axios"
import { DATA_FILE, RESOURCE_FILE } from "../../definitions/file"
import { scheduleFuture, sleep } from "../../utils/process"
import { readFile } from "../../utils/fs"
import { ClientException, panic } from "../../exceptions"
import { ServerConnectionInfo, ServerPID, ServerStatus } from "./model"

export { ServerStatus }

/**
 * 对接后台服务部分的管理器。负责监视本频道对应的后台服务的运行状态，获取其运行参数，提供后台服务的管理功能，提供部分必须的后台服务功能接入。
 * 管理器分为期望状态和实际状态两部分。
 *  - 实际状态是和实际的server运行状态几乎同步的。它会反映server的CLOSE、READY、OPEN、ERROR状态，以及server的连接信息，并通过事件告知变化。
 *  - 期望状态则指是否期望server在运行的状态。
 *    期望为false时，管理器对server是否在运行随缘，如果在就监控其生命周期，如果不在就不做监控，只会在load时尝试检测一次。
 *    期望为true时，管理器要求server不能在CLOSE状态，因此会持续监视其状态，如果发现其状态为CLOSE，就会尝试启动它。
 *    期望为true时，管理器才会尝试注册lifetime信号，来阻止server自行关闭。因此期望false时确实是随缘。
 *    将期望设置为false并不会使管理器尝试关闭server。
 *    不过还是提供了另一个方法，使管理器能强制关闭server。
 */
export interface ServerManager {
    /**
     * 获得server的当前运行状态。
     */
    status(): ServerStatus

    /**
     * 获得连接信息。在server处于CLOSE状态时没有连接信息。
     */
    connectionInfo(): ServerConnectionInfo | null

    /**
     * 获得或更改管理器的期望状态。
     */
    desired(value?: boolean): boolean

    /**
     * 注册一个事件，该事件在connection info或status发生变化时触发。
     * @param event
     */
    addEventListener(event: ServerConnectionEvent): void

    /**
     * 移除注册的事件。
     * @param event
     */
    removeEventListener(event: ServerConnectionEvent): boolean

    /**
     * 命令server状态监控器立刻检测一次状态，不等下一次了。
     */
    forceSyncStatus(): void

    /**
     * 发出强制关闭server的信号。
     */
    forceShutdown(): void
}

export interface ServerConnectionEvent {
    (content: {status: ServerStatus, info: ServerConnectionInfo | null}, oldContent: {status: ServerStatus, info: ServerConnectionInfo | null}): void
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
        console.log(`[ServerManager] Server manager is in proxy mode. URL is '${options.debug.serverFromURL}'.`)
        return createProxyServerManager(options)
    }else{
        return createNativeServerManager(options)
    }
}

function createProxyServerManager(options: ServerManagerOptions): ServerManager {
    const info = {pid: 0, url: options.debug!.serverFromURL!!, token: "dev", startTime: new Date().getTime()}

    let isDesired: boolean = false

    return {
        addEventListener() {},
        connectionInfo() {
            return info;
        },
        desired(value?: boolean) {
            if(value !== undefined && value !== isDesired) {
                isDesired = value
            }

            return isDesired
        },
        forceShutdown() {},
        forceSyncStatus() {},
        removeEventListener() {
            return true
        },
        status() {
            return ServerStatus.OPEN;
        }
    }
}

function createNativeServerManager(options: ServerManagerOptions): ServerManager {
    const debugMode = !!options.debug
    const serverBinPath = options.debug?.serverFromFolder
        ? path.join(options.debug?.serverFromFolder, RESOURCE_FILE.SERVER.BIN)
        : path.join(options.userDataPath, DATA_FILE.RESOURCE.SERVER_FOLDER, RESOURCE_FILE.SERVER.BIN)
    const channelPath = path.join(options.userDataPath, DATA_FILE.APPDATA.CHANNEL_FOLDER(options.channel))
    const serverPIDPath = path.join(channelPath, DATA_FILE.APPDATA.CHANNEL.SERVER_PID)
    const serverLogPath = path.join(channelPath, DATA_FILE.APPDATA.CHANNEL.SERVER_LOG)

    const events: ServerConnectionEvent[] = []

    let status: ServerStatus = ServerStatus.CLOSE
    let connectionInfo: ServerConnectionInfo | null = null

    let isDesired: boolean = false

    let lifetimeId: string | null = null

    const future = scheduleFuture(1000 * 30, async () => {
        //通过检查来判断是否处于平稳运行
        const running = lifetimeId != null && await checkForLifetime()
        //如果没有，就尝试恢复server
        if(!running) {
            try {
                //首先判断server是否关闭。如果是关闭的，则尝试启动server
                await checkForProcess()
                //然后判断connectionInfo能否联通。如果不能联通，持续读server.pid直到可用或超时
                await checkForConnectionInfo()
                //然后判断initializing状态
                await checkForServerLoaded()
                //注册lifetime
                await registerLifetime()
            }catch (e) {
                panic(e, debugMode)
            }
        }
    }, async () => {
        if(lifetimeId != null) {
            const res = await request({url: `${connectionInfo!.url}/app/lifetime/signal/${lifetimeId!}`, method: "delete", headers: {'Authorization': `Bearer ${connectionInfo!.token}`}})
            if(!res.ok) {
                console.warn(`Error occurred in deleting heart from server: ${res.message}`)
            }
            lifetimeId = null
        }
        setState({status: ServerStatus.CLOSE, info: null})
    })

    function setState(state: {status?: ServerStatus, info?: ServerConnectionInfo | null}) {
        const oldState = {status, info: connectionInfo}
        const newState = {status: state.status ?? status, info: state.info !== undefined ? state.info : connectionInfo}
        status = newState.status
        connectionInfo = newState.info
        for (const event of events) {
            event(newState, oldState)
        }
    }

    async function checkForProcess() {
        if(status === ServerStatus.UNKNOWN || status === ServerStatus.CLOSE || status === ServerStatus.DISCONNECTED) {
            try {
                const serverPID = await readFile<ServerPID>(serverPIDPath)
                if (serverPID == null) {
                    startServerProcess(channelPath, options.debug?.frontendFromFolder ?? path.join(options.userDataPath, DATA_FILE.RESOURCE.FRONTEND_FOLDER), debugMode, serverLogPath, serverBinPath)
                }
            }catch (e) {
                throw new ClientException("SERVER_EXEC_ERROR", e)
            }
        }
    }

    async function checkForConnectionInfo() {
        const info = await waitForServerReady(serverPIDPath, 200, 75)
        setState({status: ServerStatus.INITIALIZING, info})
    }

    async function checkForServerLoaded() {
        while (status === ServerStatus.INITIALIZING) {
            const s = await checkForHealth(connectionInfo!.url, connectionInfo!.token)
            if(s === "LOADED") {
                setState({status: ServerStatus.OPEN})
            }else{
                await sleep(200)
            }
        }
    }

    async function registerLifetime() {
        const res = await request({url: `${connectionInfo!.url}/app/lifetime/signal`, method: "post", headers: {'Authorization': `Bearer ${connectionInfo!.token}`}, data: {interval: 1000 * 120}})
        if(res.ok) {
            lifetimeId = (<{id: string}>res.data).id
        }else{
            throw new ClientException("SERVER_REGISTER_ERROR", `Error occurred while creating heart in server: ${res.message}`)
        }
    }

    async function checkForLifetime(): Promise<boolean> {
        const res = await request({
            url: `${connectionInfo!.url}/app/lifetime/signal/${lifetimeId!}`,
            method: "put",
            headers: { 'Authorization': `Bearer ${connectionInfo!.token}` },
            data: { interval: 1000 * 60 }
        })
        if (!res.ok) {
            //发现无法正常访问lifetime
            setState({status: ServerStatus.DISCONNECTED})
            return false
        }
        return true
    }

    function desired(value?: boolean): boolean {
        if(value !== undefined && value !== isDesired) {
            isDesired = value
            if(isDesired) {
                future.start()
            }else{
                future.stop()
            }
        }

        return isDesired
    }

    function forceSyncStatus() {

    }

    function forceShutdown() {

    }

    return {
        desired,
        forceSyncStatus,
        forceShutdown,
        status() {
            return status
        },
        connectionInfo() {
            return connectionInfo
        },
        addEventListener(event: ServerConnectionEvent) {
            events.push(event)
        },
        removeEventListener(event: ServerConnectionEvent): boolean {
            const i = events.findIndex(e => e === event)
            if(i >= 0) {
                events.splice(i, 1)
                return true
            }
            return false
        }
    }
}

function startServerProcess(channelPath: string, frontendPath: string, debugMode: boolean, serverLogPath: string, serverBinPath: string) {
    const baseArgs = ['--channel-path', channelPath, '--frontend-path', frontendPath]
    const debugModeArgs = debugMode ? ['--force-token', 'dev'] : []
    const out = openSync(serverLogPath, "w")
    const s = spawn(serverBinPath, [...baseArgs, ...debugModeArgs], {
        detached: true,
        stdio: ["ignore", out, out]
    })
    s.unref()
}

/**
 * 检查server服务是否可用(方式是调/health接口检查是否已经可以走通)。
 * @return 如果已经可用，返回LOADED; 如果server还在加载，返回LOADING; 还不可用就返回undefined。
 * @throws 如果访问产生401/403，视为无法解决的致命错误，抛出一个Error。
 */
async function checkForHealth(url: string, token: string): Promise<"LOADING" | "LOADED" | undefined> {
    const res = await request({url: `${url}/app/health`, method: 'GET', headers: {'Authorization': `Bearer ${token}`}})
    if(res.ok) {
        return (<{status: "LOADING" | "LOADED"}>res.data).status
    }else if(res.status) {
        throw new ClientException("SERVER_WAITING_EXIT", `Unexpected status ${res.status} in health check: ${res.message}`)
    }else{
        return undefined
    }
}

/**
 * 查询serverPID文件以及端口是否可用。
 * @return 如果可用，返回pid、url和token；如果存在致命错误，抛出异常。
 * @throws 如果token不对，视为无法解决的致命错误，抛出一个Error。
 */
async function checkForAvailable(pidPath: string): Promise<ServerConnectionInfo | null> {
    const serverPID = await readFile<ServerPID>(pidPath)
    if(serverPID != null) {
        if(serverPID.port != null && serverPID.token != null) {
            const { pid, port, token, startTime } = serverPID
            const url = `http://127.0.0.1:${port}`
            if(await checkForHealth(url, token)) {
                return {pid, url, token, startTime}
            }
        }
    }
    return null
}

/**
 * 轮询serverPID文件直到端口可用或超时。
 */
async function waitForServerReady(path: string, interval: number, loop: number): Promise<ServerConnectionInfo> {
    for(let i = 0; i < loop; ++i) {
        await sleep(interval)
        const result = await checkForAvailable(path)
        if(result != null) {
            return result
        }
    }
    throw new ClientException("SERVER_WAITING_TIMEOUT")
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
