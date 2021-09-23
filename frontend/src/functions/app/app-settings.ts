import { onMounted, ref, watch, toRaw, computed, onUnmounted, readonly } from "vue"
import { AppearanceSetting, clientMode, ipc, ResourceStatus, AuthSetting } from "@/functions/adapter-ipc"
import { useToast } from "@/functions/module/toast"
import { useAppInfo } from "./app-state"

export function useAuthSetting() {
    if(!clientMode) {
        throw new Error("Cannot access appearance in web.")
    }

    const value = ref<AuthSetting>()

    onMounted(async () => value.value = await ipc.auth.get())

    watch(value, async (_, o) => {
        if(o !== undefined && value.value !== undefined) {
            await ipc.auth.set(toRaw(value.value))
        }
    }, {deep: true})

    return value
}

export function useCliController() {
    if(!clientMode) {
        throw new Error("Cannot access appearance in web.")
    }
    const notification = useToast()

    const status = ref<ResourceStatus>(ResourceStatus.LATEST)

    const update = async () => {
        if(status.value === ResourceStatus.NEED_UPDATE || status.value === ResourceStatus.NOT_INIT) {
            status.value = ResourceStatus.UPDATING
            const res = await ipc.cli.update()
            if(res.ok) {
                status.value = ResourceStatus.LATEST
            }else{
                status.value = ResourceStatus.NOT_INIT
                notification.handleError("CLI部署失败", res.errorMessage)
                console.error(res.errorMessage)
            }
        }
    }

    onMounted(async () => status.value = await ipc.cli.status())

    return {
        status,
        update
    }
}

export function useAppearance() {
    if(!clientMode) {
        throw new Error("Cannot access appearance in web.")
    }
    const appearance = ref<AppearanceSetting>()

    onMounted(async () => appearance.value = await ipc.appearance.get())

    watch(appearance, async (_, o) => {
        if (o !== undefined && appearance.value !== undefined) {
            await ipc.appearance.set(toRaw(appearance.value))
        }
    }, {deep: true})

    return appearance
}

export function useServerInfo() {
    const info = ref<{running: false} | {running: true, pid: number, port: number, runningTime: string}>()

    let timeId: number | null = null
    let startTime: number = 0

    onMounted(async () => {
        const serverInfo = await ipc.server.serverInfo()
        if(serverInfo.running) {
            startTime = serverInfo.startTime
            info.value = {
                running: true,
                pid: serverInfo.pid,
                port: serverInfo.port,
                runningTime: formatInterval(new Date().getTime() - startTime)
            }

            timeId = setInterval(() => {
                if(info.value?.running) {
                    info.value!.runningTime = formatInterval(new Date().getTime() - startTime)
                }
            }, 1000)
        }else{
            info.value = {running: false}
        }
    })

    onUnmounted(() => {
        if(timeId != null) {
            clearInterval(timeId)
        }
    })

    function formatInterval(interval: number): string {
        const secInterval = Math.floor(interval / 1000)
        const sec = secInterval % 60
        const min = (secInterval - sec) % 3600 / 60
        const hour = Math.floor(secInterval / 3600)

        function dbl(i: number): string | number {
            return i >= 10 ? i : `0${i}`
        }

        return `${dbl(hour)}:${dbl(min)}:${dbl(sec)}`
    }

    return readonly(info)
}

export function useChannelSetting() {
    const appInfo = useAppInfo()
    if(!appInfo.clientMode) {
        throw new Error("Cannot access appearance in web.")
    }

    const currentChannel = appInfo.channel
    const list = ref<string[]>([])
    const defaultChannel = ref<string>()
    const channels = computed(() => list.value.map(channel => ({ channel, isDefault: defaultChannel.value === channel })))

    onMounted(async () => {
        list.value = await ipc.channel.list()
        defaultChannel.value = await ipc.channel.getDefault()
    })

    const setDefaultChannel = async (channel: string) => {
        defaultChannel.value = channel
        await ipc.channel.setDefault(channel)
    }

    return {channels, currentChannel, defaultChannel, setDefaultChannel, restart: ipc.channel.change}
}
