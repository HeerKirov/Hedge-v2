import { onMounted, ref, watch, toRaw, computed } from "vue"
import { AppearanceSetting, clientMode, ipc, ResourceStatus, AuthSetting } from "@/functions/adapter-ipc"
import { useAppInfo } from "@/functions/service/app-state"

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
    const status = ref<ResourceStatus>(ResourceStatus.LATEST)

    const update = async () => {
        if(status.value === ResourceStatus.NEED_UPDATE || status.value === ResourceStatus.NOT_INIT) {
            status.value = ResourceStatus.UPDATING
            const res = await ipc.cli.update()
            if(res.ok) {
                status.value = ResourceStatus.LATEST
            }else{
                status.value = ResourceStatus.NOT_INIT
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
    if(!clientMode) {
        throw new Error("Cannot access server in web.")
    }
    const connection = ipc.app.env().connection
    if(connection != null) {
        return {
            running: true,
            pid: connection.pid!,
            url: connection.url!
        }
    }else{
        return {
            running: false
        }
    }
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

    return {channels, currentChannel, defaultChannel, setDefaultChannel}
}
