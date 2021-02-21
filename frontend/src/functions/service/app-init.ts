import { onMounted, onUnmounted, ref } from "vue"
import { InitConfig, InitState, ipc } from "@/functions/adapter-ipc"

export function useInitController() {
    const state = ref<InitState>()

    const initializeApp = (config: InitConfig) => {
        state.value = InitState.INITIALIZING
        ipc.app.init(config).finally(() => {})
    }

    function onInitChanged(newState: InitState) {
        state.value = newState
    }

    onMounted(() => ipc.app.initChangedEvent.addEventListener(onInitChanged))
    onUnmounted(() => ipc.app.initChangedEvent.removeEventListener(onInitChanged))

    return {
        state,
        initializeApp
    }
}