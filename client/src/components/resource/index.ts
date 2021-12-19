import path from "path"
import { promisify } from "util"
import { exec, execFile } from "child_process"
import { arrays } from "../../utils/types"
import {
    cpR,
    unzip,
    rename,
    chmod,
    rmdir,
    readFile,
    writeFile,
    existsFile,
    readFileStr,
    appendFileStr, mkdir
} from "../../utils/fs"
import { DATA_FILE, APP_FILE, RESOURCE_FILE } from "../../definitions/file"
import { Version, VersionLock, VersionStatus, VersionStatusSet } from "./model"
import { ClientException } from "../../exceptions"
import { Platform } from "../../utils/process"

/**
 * 记录系统中资源组件的最新版本号。必须更新此记录值至最新，才能正确触发版本更新。
 */
const VERSION = {
    server: "0.1.0",
    frontend: "0.1.0",
    cli: "0.1.0"
}

/**
 * 对app程序资源进行管理的管理器。
 * 程序资源指的是cli、server及其携带的frontend资源。这些资源平时打包在App资源包下，但运行时需要解压缩并放到userData目录下。
 * server和frontend捆绑更新，并作为程序基础更新；cli则单独更新，且不是程序的必要组成部分，是一个额外功能。
 * 同时，这种解压缩还涉及到app版本更新的问题，因此需要一个组件专门去管理。
 */
export interface ResourceManager {
    /**
     * 在app的后初始化环节调用。异步地读取资源的当前状况，将状态记录下来，以供后续策略调用。
     */
    load(): Promise<void>
    /**
     * 在资源不是最新的情况下，将资源更新至最新。
     */
    update(): Promise<void>
    /**
     * 单独对cli资源进行更新。
     */
    updateCli(): Promise<void>
    /**
     * 查看资源的当前状态。
     * - NOT_INIT: server/frontend资源没有初始化。
     * - NEED_UPDATE: server/frontend/cli(如果已初始化)任意资源需要更新。
     * - UPDATING: 资源更新中。
     * - LATEST: server/frontend处于最新，cli未初始化或处于最新。
     */
    status(): ResourceStatus
    /**
     * 查看cli资源是否已加载。
     */
    getCliStatus(): ResourceStatus
}

export enum ResourceStatus {
    UNKNOWN = "UNKNOWN",
    NOT_INIT = "NOT_INIT",
    NEED_UPDATE = "NEED_UPDATE",
    UPDATING = "UPDATING",
    LATEST = "LATEST"
}

/**
 * 构造参数。
 */
export interface ResourceManagerOptions {
    /**
     * 系统平台。
     */
    platform: Platform
    /**
     * app的数据目录。
     */
    userDataPath: string
    /**
     * app的资源目录，指代/Resource/app目录，在此目录下寻找资源。
     */
    appPath: string
    /**
     * 用户目录。
     */
    homePath: string
    /**
     * 在调试模式下运行，默认将禁用资源管理，除非指定其他选项，对资源管理进行调试。
     */
    debug?: {
        /**
         * 使用此位置的压缩包提供的后台资源，进行资源组件的调试。
         */
        serverFromResource?: string
        /**
         * 使用此位置的前端资源，进行资源组件的调试。此选项的前提是启用了后台资源的调试。
         */
        frontendFromFolder?: string
    }
}

export function createResourceManager(options: ResourceManagerOptions): ResourceManager {
    if(options.debug && !options.debug.serverFromResource) {
        //禁用资源管理
        console.log("[ResourceManager] Resource manager is disabled because of develop mode.")
        return createForbiddenResourceManager()
    }else{
        //在生产环境或调试模式启用资源管理
        return createProductionResourceManager(options)
    }
}

function createForbiddenResourceManager(): ResourceManager {
    return {
        async load() {},
        async update() {},
        async updateCli() {},
        status() {
            return ResourceStatus.LATEST
        },
        getCliStatus() {
            return ResourceStatus.LATEST
        }
    }
}

function createProductionResourceManager(options: ResourceManagerOptions): ResourceManager {
    const versionLockPath = path.join(options.userDataPath, DATA_FILE.RESOURCE.VERSION_LOCK)

    let status: ResourceStatus = ResourceStatus.UNKNOWN
    let cliStatus: ResourceStatus = ResourceStatus.UNKNOWN
    const version: VersionStatusSet = {}

    async function load() {
        try {
            const versionLock = await readFile<VersionLock>(versionLockPath)
            if(versionLock == null) {
                status = ResourceStatus.NOT_INIT
                cliStatus = ResourceStatus.NOT_INIT
            }else{
                version.server = createVersionStatus(versionLock.server, VERSION.server)
                version.frontend = createVersionStatus(versionLock.frontend, VERSION.frontend)
                version.cli = versionLock.cli && createVersionStatus(versionLock.cli, VERSION.cli)
                if(version.server.latestVersion || version.frontend.latestVersion || version.cli?.latestVersion) {
                    status = ResourceStatus.NEED_UPDATE
                }else{
                    status = ResourceStatus.LATEST
                }
                if(!versionLock.cli) {
                    cliStatus = ResourceStatus.NOT_INIT
                }else if(version.cli?.latestVersion) {
                    cliStatus = ResourceStatus.NEED_UPDATE
                }else{
                    cliStatus = ResourceStatus.LATEST
                }
            }
        }catch (e) {
            throw new ClientException("RESOURCE_LOAD_ERROR", e)
        }
    }

    async function update() {
        try {
            if(status == ResourceStatus.NOT_INIT || status == ResourceStatus.NEED_UPDATE || cliStatus == ResourceStatus.NEED_UPDATE) {
                if(cliStatus == ResourceStatus.NEED_UPDATE) {
                    cliStatus = ResourceStatus.UPDATING
                    await updatePartCli()
                    cliStatus = ResourceStatus.LATEST
                }
                if(status == ResourceStatus.NOT_INIT || status == ResourceStatus.NEED_UPDATE) {
                    status = ResourceStatus.UPDATING
                    if(version.server == undefined || version.server.latestVersion != undefined) {
                        await updatePartServer()
                    }
                    await updatePartFrontend()
                    status = ResourceStatus.LATEST
                }
                await save()
            }
        }catch (e) {
            throw new ClientException("RESOURCE_UPDATE_ERROR", e)
        }
    }

    async function updateCli() {
        try {
            if(cliStatus == ResourceStatus.NOT_INIT || cliStatus == ResourceStatus.NEED_UPDATE) {
                cliStatus = ResourceStatus.UPDATING
                await updatePartCli()
                cliStatus = ResourceStatus.LATEST
                await save()
            }
        }catch (e) {
            throw new ClientException("RESOURCE_UPDATE_ERROR", e)
        }
    }

    async function save() {
        await writeFile<VersionLock>(versionLockPath, {
            server: {updateTime: version.server!.lastUpdateTime.getTime(), version: version.server!.currentVersion},
            frontend: {updateTime: version.frontend!.lastUpdateTime.getTime(), version: version.frontend!.currentVersion},
            cli: version.cli && {updateTime: version.cli.lastUpdateTime.getTime(), version: version.cli.currentVersion}
        })
    }

    async function updatePartServer() {
        const originDest = path.join(options.userDataPath, DATA_FILE.RESOURCE.ORIGINAL_SERVER_FOLDER)
        const dest = path.join(options.userDataPath, DATA_FILE.RESOURCE.SERVER_FOLDER)
        await rmdir(dest)
        //image.zip解压后的文件是/image目录，因此采取将其解压到根目录然后重命名的方法。
        await unzip(options.debug?.serverFromResource || path.join(options.appPath, APP_FILE.SERVER_ZIP), options.userDataPath)
        await rename(originDest, dest)
        //通过unzipper解压后，可执行信息丢失，需要重新添加。
        await chmod(path.join(dest, RESOURCE_FILE.SERVER.BIN), "755")
        await chmod(path.join(dest, "bin/java"), "755")
        await chmod(path.join(dest, "bin/keytool"), "755")
        await chmod(path.join(dest, "lib/jspawnhelper"), "755")
        version.server = {lastUpdateTime: new Date(), currentVersion: version.server?.latestVersion ?? VERSION.server}
    }

    async function updatePartFrontend() {
        const dest = path.join(options.userDataPath, DATA_FILE.RESOURCE.FRONTEND_FOLDER)
        await rmdir(dest)
        await cpR(options.debug?.frontendFromFolder || path.join(options.appPath, APP_FILE.FRONTEND_FOLDER), dest)
        version.frontend = {lastUpdateTime: new Date(), currentVersion: version.frontend?.latestVersion ?? VERSION.frontend}
    }

    async function updatePartCli() {
        async function whichCommand(goal: string): Promise<string | null> {
            try {
                const { stdout } = await promisify(exec)(`which ${goal}`)
                return stdout.trim()
            }catch (e) {
                return null
            }
        }

        async function appendSourceInShellRc(rc: string, dest: string): Promise<boolean> {
            const appendContent = `PATH="$PATH:${dest}"`
            const content = await readFileStr(rc)
            if(content !== null) {
                if(!content.includes(appendContent)) {
                    await appendFileStr(rc, `\n\n# Hedge CLI PATH\n${appendContent}\n`)
                }
                return true
            }else{
                return false
            }
        }

        const dest = path.join(options.userDataPath, DATA_FILE.RESOURCE.CLI_FOLDER)
        //首先判断python3和virtualenv是否可用
        const python3Path = await whichCommand("python3")
        const virtualenvPath = await whichCommand("virtualenv")
        if(python3Path == null) {
            throw "Cli depends on 'python3' but which is not found."
        }else if(virtualenvPath == null) {
            throw "Cli depends on 'virtualenv' but which is not found."
        }

        //将src, requirements.txt, startup.sh等关键文件覆盖过来
        await rmdir(path.join(dest, "src"))
        await mkdir(path.join(dest, "src"))
        await cpR(path.join(options.appPath, APP_FILE.CLI_FOLDER, "src"), dest)
        await cpR(path.join(options.appPath, APP_FILE.CLI_FOLDER, "requirements.txt"), dest)
        await cpR(path.join(options.appPath, APP_FILE.CLI_FOLDER, "startup.sh"), path.join(dest, "hedge"))
        await chmod(path.join(dest, "hedge"), "755")

        //PATH路径注入
        if(options.platform === "darwin" || options.platform === "linux") {
            if(await appendSourceInShellRc(path.join(options.homePath, ".zshrc"), dest)) {
                //do nothing
            }else if(await appendSourceInShellRc(path.join(options.homePath, ".bashrc"), dest)) {
                //do nothing
            }else if(await appendSourceInShellRc(path.join(options.homePath, ".profile"), dest)) {
                //do nothing
            }else{
                console.warn(`No any shell found in ${options.homePath} (such as .zshrc, .bashrc, .profile). PATH inject failed.`)
            }
        }

        //判断python虚拟环境是否已安装，并尝试安装
        if(!await existsFile(path.join(dest, "venv"))) {
            await promisify(exec)(`${virtualenvPath} ${path.join(dest, "venv")}`)
        }

        //尝试更新依赖
        await cpR(path.join(options.appPath, APP_FILE.CLI_FOLDER, "install.sh"), dest)
        await chmod(path.join(dest, "install.sh"), "755")
        await promisify(execFile)(path.join(dest, "install.sh"))
        await rmdir(path.join(dest, "install.sh"))

        //添加一个conf.local.json文件
        await writeFile(path.join(dest, "conf.local.json"), {
            "userDataPath": options.userDataPath,
            "appPath": path.join(options.appPath, "../..")
        })

        version.cli = {lastUpdateTime: new Date(), currentVersion: version.cli?.latestVersion ?? VERSION.cli}
    }

    return {
        load,
        update,
        updateCli,
        status() {
            return status
        },
        getCliStatus() {
            return cliStatus
        }
    }
}

/**
 * 构造一个version status单元。构造的同时判断此单元是否需要升级。
 */
function createVersionStatus(version: Version, latestVersion: string): VersionStatus {
    return {
        currentVersion: version.version,
        lastUpdateTime: new Date(version.updateTime),
        latestVersion: isVersionNeedChange(version.version, latestVersion) ? latestVersion : undefined
    }
}

/**
 * 判断到目标版本号是否需要变更。
 * 变更有两种可能：一，版本升级；二，版本在x.y版本号上进行了降级。
 */
function isVersionNeedChange(current: string, latest: string): boolean {
    const [cA, cB, cC] = current.split(".").map(i => parseInt(i))
    const [lA, lB, lC] = latest.split(".").map(i => parseInt(i))

    if(cA === lA && cB === lB && cC === lC) {
        return false
    }else if(arrays.compare([cA, cB, cC], [lA, lB, lC]) < 0) {
        return true
    }else{
        return arrays.compare([cA, cB], [lA, lB]) > 0
    }
}
