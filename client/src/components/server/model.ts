export interface ServerPID {
    pid: number
    port?: number
    token?: string
    startTime: number
}

export enum ServerStatus {
    UNKNOWN = "UNKNOWN",            //组件还没有初始化，因此并不知道是个什么状态。
    CLOSE = "CLOSE",                //进程关闭。表现为server.pid不存在、port不通。
    INITIALIZING = "INITIALIZING",  //进程运行中。表现为port可走通，心跳检查通过，但还未初始化。
    OPEN = "OPEN",                  //进程运行中，且监测到server已初始化。
    DISCONNECTED = "DISCONNECTED"   //进程连接异常。含义为进程在运行，但心跳检查被拒绝，无法访问。
}

export interface ServerConnectionInfo {
    pid: number
    url: string
    token: string
    startTime: number
}
