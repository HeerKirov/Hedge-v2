import { onMounted, onUnmounted, ref } from "vue"
import { InitConfig, InitState, InitStateRes, ipc } from "@/functions/adapter-ipc"

export function useInitController() {
    const state = ref<InitState>()
    const error = <{errorCode?: string, errorMessage?: string}>{}

    const initializeApp = async (config: InitConfig) => {
        state.value = InitState.INITIALIZING
        const { state: newState, errorCode, errorMessage } = await ipc.app.init(config)
        error.errorCode = errorCode
        error.errorMessage = errorMessage
        state.value = newState
    }

    function onInitChanged({ state: newState, errorCode, errorMessage }: InitStateRes) {
        error.errorCode = errorCode
        error.errorMessage = errorMessage
        state.value = newState
    }

    onMounted(() => ipc.app.initChangedEvent.addEventListener(onInitChanged))
    onUnmounted(() => ipc.app.initChangedEvent.removeEventListener(onInitChanged))

    return {
        state,
        initializeApp,
        error
    }
}