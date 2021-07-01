/**
 * 使用vue响应系统构建的、自动建立依赖与自动解除依赖的event emitter。
 */
import { Ref, ref, watch } from "vue"

export interface RefEmitter<T> {
    emitter: Readonly<Ref<T | undefined>>
}

interface SendRefEmitter<T> extends RefEmitter<T> {
    emit(arg: T): void
}

export function useRefEmitter<T>(): SendRefEmitter<T> {
    const emitter: Ref<T | undefined> = ref()

    const emit = (arg: T) => {
        emitter.value = arg
        emitter.value = undefined
    }

    return {emitter: emitter, emit}
}

export function useListeningEvent<T>(emitter: RefEmitter<T>, event: (arg: T) => void) {
    watch(emitter.emitter, v => {
        if(v !== undefined) {
            event(v)
        }
    }, {flush: "sync"})
}
