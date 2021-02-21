/**
 * 简化版的、只有单一事件的event emitter。
 */
export interface Emitter<T> {
    addEventListener(event: EmitterEvent<T>)
    removeEventListener(event: EmitterEvent<T>)
    removeAllEventListeners()
}

interface SendEmitter<T> extends Emitter<T> {
    emit(arg: T)
}

type EmitterEvent<T> = (arg: T) => void

export function createEmitter<T>(): SendEmitter<T> {
    let events: EmitterEvent<T>[] = []

    return {
        addEventListener(event: EmitterEvent<T>) {
            events.push(event)
        },
        removeEventListener(event: EmitterEvent<T>) {
            events = events.filter(e => e !== event)
        },
        removeAllEventListeners() {
            events = []
        },
        emit(arg: T) {
            for (let event of events) {
                event(arg)
            }
        }
    }
}