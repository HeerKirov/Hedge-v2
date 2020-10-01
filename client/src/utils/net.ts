import os from "os"
import net from "net"

/**
 * 解析一段标准端口范围。
 * @param port 例如"8000,9000-9010"这样的混合端口范围
 */
export function* analyzePort(port: string): Generator<number> {
    try {
        const ports: ([number, number] | number)[] = port.split(",").map(s => {
            if(s.indexOf("-") >= 0) {
                const [lower, upper] = s.split("-", 2).map(r => parseInt(r))
                return [lower, upper]
            }else{
                return parseInt(s)
            }
        })

        for(const p of ports) {
            if(typeof p === 'number') {
                yield p
            }else{
                const [lower, upper] = p
                for(let i = lower; i <= upper; ++i) {
                    yield i
                }
            }
        }
    }catch(e) {/*什么也不做。yield函数会因此EOF*/}
}

export function* generatePort(beginPort: number, step: number = 10): Generator<number> {
    for(let i = beginPort; i < 65535; i += step) {
        yield i
    }
}

/**
 * 从port迭代器中查找到下一个可用的端口。如果不存在任何可用的端口，返回null。
 */
export async function getNextAvailablePort(iterator: Generator<number>): Promise<number | null> {
    for(let result = iterator.next(); !result.done; result = iterator.next()) {
        const port = result.value
        if(await isAvailablePort(port)) {
            return port
        }
    }
    return null
}

/**
 * 检测目标端口是否可用。
 * @param port
 */
export async function isAvailablePort(port: number): Promise<boolean> {
    const server = net.createServer().listen(port)
    return new Promise((resolve, reject) => {
        server.on('listening',() => {
            server.close()
            resolve(true)
        })

        server.on('error',(e: any) => {
            if(e.code === 'EADDRINUSE') {
                resolve(false)
            }else{
                reject(e)
            }
        })
    })
}

/**
 * 查看本机在局域网的IP地址。如果不存在，返回null。
 */
export function getLocalNetworkHost(): string | null {
    const ifaces = os.networkInterfaces()
    for(const dev in ifaces) {
        for(const alias of ifaces[dev]!!) {
            if(alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal) {
                return alias.address
            }
        }
    }
    return null
}
