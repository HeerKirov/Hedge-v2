import Koa from "koa"
import { Server } from "http"
import { Service } from "../../service"
import { AppDataDriver } from "../appdata"
import { Platform } from "../../utils/process"
import { analyzePort, generatePort, getLocalNetworkHost, getNextAvailablePort } from "../../utils/net"

/**
 * 通过HTTP协议与前端进行服务通信的controller。
 * 它的职责是将全部service提供给前端使用。此外还提供一些平台类参数的快查。
 * 此外，它还要以静态资源的方式提供web前端的访问。
 */
export interface WebServer {
    /**
     * web server是否已经打开。
     */
    isOpened(): boolean
    /**
     * 打开web server，并返回server信息。
     * 如果已经打开，则什么都不会做。如果打开失败，返回null。
     */
    open(): Promise<WebServerInfo | null>
    /**
     * 关闭web server。
     * 如果已经关闭，则什么都不会做。
     */
    close(): Promise<void>
    /**
     * 获得web server的信息。
     * 在未打开时调用，会得到null。
     */
    info(): WebServerInfo | null
}

export interface WebServerInfo {
    localNetworkHost: string | null
    port: number
}

export interface WebServerOptions {
    debugMode: boolean
    platform: Platform
    appDataPath: string
    debugFrontendDist?: string
}

export function createWebServer(service: Service, appDataDriver: AppDataDriver, options: WebServerOptions): WebServer {
    let webServerInfo: WebServerInfo | null = null
    let server: Server | null = null

    function isOpened() {
        return server != null
    }

    function info() {
        return webServerInfo
    }

    async function open(): Promise<WebServerInfo | null> {
        if(server == null) {
            return new Promise(async (resolve, reject) => {
                if(server == null) {
                    const portOption = appDataDriver.getAppData().webOption.port
                    const port = await getNextAvailablePort(portOption ? analyzePort(portOption) : generatePort(9000))
                    if(port == null) {
                        reject(null)
                    }else{
                        const info = {localNetworkHost: getLocalNetworkHost(), port}

                        server = createKoaApplication().listen(info.port, () => resolve(webServerInfo!!))
                        webServerInfo = info
                    }
                }else{
                    resolve(webServerInfo!!)
                }
            })
        }else{
            return webServerInfo!!
        }
    }

    async function close(): Promise<void> {
        if(server != null) {
            return new Promise((resolve => {
                if(server != null) {
                    server.close(() => resolve())
                    server = null
                }
            }))
        }
    }

    return {isOpened, info, open, close}
}

export interface WebServerProxy {
    proxy(webServer: WebServer): WebServer
}

export function createWebServerProxy(): WebServer & WebServerProxy {
    let target: WebServer | null = null

    return {
        proxy(webServer) {
            return target = webServer
        },
        isOpened() {
            return target!!.isOpened()
        },
        open() {
            return target!!.open()
        },
        close() {
            return target!!.close()
        },
        info() {
            return target!!.info()
        }
    }
}

function createKoaApplication() {
    const koa = new Koa()

    koa.use(async ctx => {
        ctx.body = 'Hello, world!'
    })

    return koa
}
