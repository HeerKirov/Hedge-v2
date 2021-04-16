export const APP_FILE = {
    FRONTEND_FOLDER: "../frontend",
    SERVER_ZIP: "../server.zip",
    CLI_ZIP: "../cli.zip"
}

export const DATA_FILE = {
    RESOURCE: {
        VERSION_LOCK: "version.lock",
        SERVER_FOLDER: "server",
        FRONTEND_FOLDER: "server/frontend",
        ORIGINAL_SERVER_FOLDER: "image",
        CLI_FOLDER: "cli"
    },
    APPDATA: {
        CLIENT_CONFIG: "appdata/client.json",
        CHANNEL_FOLDER(name: string) { return `appdata/channel/${name}` },
        CHANNEL: {
            SERVER_PID: "server.pid",
            SERVER_LOG: "server.log",
            CLIENT_DATA: "client.dat",
            PUBLIC_DATA: "public.dat"
        }
    }
}

export const RESOURCE_FILE = {
    SERVER: {
        BIN: "bin/hedge-v2-server"
    },
    FRONTEND: {
        INDEX: "index.html"
    }
}
