export type ServerPID = ServerOkPID | ServerErrPID

interface ServerOkPID {
    ok: true
    pid: number
    port: number
    token: string
}

interface ServerErrPID {
    ok: false
    error: string[]
}

export type ServerStatus = ServerOkStatus | ServerErrStatus

interface ServerOkStatus {
    ok: true
    host: string
    token: string
}

interface ServerErrStatus {
    ok: false
    error: string[]
}
