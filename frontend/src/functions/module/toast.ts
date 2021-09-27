import { inject, InjectionKey, provide, reactive } from "vue"
import { BasicException } from "@/functions/adapter-http/exception"

export type ToastType = "success" | "warning" | "danger" | "info" | "plain"

export interface ToastManager {
    toast(title: string, type: ToastType, content: string | string[] | undefined): void
    handleError(title: string, message: string | undefined): void
    handleException(e: BasicException): void
}

interface ToastConsumer extends ToastManager {
    toasts: Toast[]
}

interface Toast {
    uniqueKey: number
    title: string
    type: ToastType
    content: string[]
}

export function installToastManager(): ToastConsumer {
    let seq = 0

    const toasts = reactive<Toast[]>([])

    const toast = (title: string, type: ToastType, content: string | string[] | undefined) => {
        toasts.push({uniqueKey: seq++, title, type, content: typeof content === "string" ? [content] : content ?? []})
    }
    const handleError = (title: string, message: string | undefined) => toast(title, "danger", message)
    const handleException = (e: BasicException) => toast(`${e.status}: ${e.code}`, "danger", e.message)

    const notificationConsumer = { toasts, toast, handleError, handleException }

    provide(toastInjection, notificationConsumer)

    return notificationConsumer
}

export function useToast(): ToastManager {
    return useToastConsumer()
}

export function useToastConsumer(): ToastConsumer {
    return inject(toastInjection)!
}

const toastInjection: InjectionKey<ToastConsumer> = Symbol()
