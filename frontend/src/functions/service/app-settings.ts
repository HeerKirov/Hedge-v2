import { onMounted, ref, watch, toRaw } from "vue"
import { AppearanceSetting, clientMode, ipc, ResourceStatus } from "@/functions/adapter-ipc"


export function useCliController() {
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
    }, { deep: true })

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