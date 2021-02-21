import { computed, inject, InjectionKey, ref, Ref } from "vue"
import { RemoteClientAdapter } from "../adapter-ipc"

export function useFullscreenInjection(clientMode: boolean, remote: RemoteClientAdapter): Ref<boolean> {
    if(clientMode) {
        const fullscreen = ref(remote.fullscreen.isFullscreen())
        remote.fullscreen.onFullscreenChanged(v => {
            fullscreen.value = v
        })

        return computed({
            get() { return fullscreen.value },
            set(value) {
                fullscreen.value = value
                remote.fullscreen.setFullscreen(value)
            }
        })
    }else{
        return computed({
            get() { return false },
            set() { }
        })
    }
}

export function useFullscreen(): Ref<boolean> {
    return inject(FullscreenInjection)!
}

export const FullscreenInjection: InjectionKey<Ref<boolean>> = Symbol()