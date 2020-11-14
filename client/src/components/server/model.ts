export interface ServerPID {
    pid?: number
    port?: number
    token?: string
    errors?: string[]
}

interface ServerErrPID {
    ok: false
    error: string[]
}

export enum ServerStatus {
    UNKNOWN = "UNKNOWN",        //没有进行过任何状态检查，因此不知道什么状态
    CLOSE = "CLOSE",            //进程关闭。表现为server.pid不存在或port不通
    OPEN = "OPEN",              //进程正在运行。表现为server.pid存在且port走通
    ERROR = "ERROR",            //进程存在致命错误。表现为server.pid存在但是errors有值
}

export interface ServerConnectionInfo {
    url: string
    token: string
}
