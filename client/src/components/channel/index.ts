import { app } from "electron"
import {readdir, readFile, writeFile} from "../../utils/fs"
import { DATA_FILE } from "../../definitions/file"
/**
 * 信道和启动参数管理器。它没有初始化函数，但构造函数异步，初始化在所有组件之前，因为需要依赖此组件获得channel属性。
 */

export interface Channel {
    currentChannel(): string
    getChannelList(): Promise<string[]>
    setDefaultChannel(channel: string): Promise<void>
    restartWithChannel(channel: string): void
}

export interface ChannelOptions {
    userDataPath: string
    defaultChannel: string
    manualChannel?: string
}

export async function createChannel(options: ChannelOptions): Promise<Channel> {
    const clientConfigPath = `${options.userDataPath}/${DATA_FILE.APPDATA.CLIENT_CONFIG}`
    const channelFolderPath = `${options.userDataPath}/${DATA_FILE.APPDATA.CHANNEL_FOLDER("")}`

    //在client.json只有defaultChannel一项参数的情况下，围绕此参数完成逻辑
    const channel = options.manualChannel ?? await getDefaultChannelFromConfiguration() ?? options.defaultChannel

    async function getDefaultChannelFromConfiguration() {
        const configuration = await readFile<ClientConfiguration>(clientConfigPath)
        return configuration?.defaultChannel
    }

    async function getChannelList(): Promise<string[]> {
        return await readdir(channelFolderPath)
    }

    async function setDefaultChannel(channel: string): Promise<void> {
        await writeFile<ClientConfiguration>(clientConfigPath, {defaultChannel: channel})
    }

    async function restartWithChannel(channel: string) {
        //懒得从旧参数里剔除--channel了。放在开头覆盖就行。
        app.relaunch({args: ["--channel", channel].concat(process.argv.slice(2))})
        app.exit(0)
    }

    return {
        currentChannel() {
            return channel
        },
        getChannelList,
        setDefaultChannel,
        restartWithChannel
    }
}

interface ClientConfiguration {
    defaultChannel?: string
}
