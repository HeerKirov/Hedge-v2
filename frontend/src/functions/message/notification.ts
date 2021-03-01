import { inject, InjectionKey, provide, reactive } from "vue"
import { HttpException } from "@/functions/adapter-http/exception"

export type NotificationType = "success" | "warning" | "danger" | "info" | "plain"

export interface NotificationManager {
    notify(title: string, type: NotificationType, content: string | string[] | undefined): void
    handleError(title: string, message: string | undefined): void
    handleException(e: HttpException): void
}

interface NotificationConsumer extends NotificationManager {
    notifications: Notification[]
}

interface Notification {
    uniqueKey: number
    title: string
    type: NotificationType
    content: string[]
}

export function installNotificationManager(): NotificationConsumer {
    let seq = 0

    const notifications = reactive<Notification[]>([])

    const notify = (title: string, type: NotificationType, content: string | string[] | undefined) => {
        notifications.push({uniqueKey: seq++, title, type, content: typeof content === "string" ? [content] : content ?? []})
    }
    const handleError = (title: string, message: string | undefined) => notify(title, "danger", message)
    const handleException = (e: HttpException) => notify(`${e.status}: ${e.code}`, "danger", e.message)

    const notificationConsumer = { notifications, notify, handleError, handleException }

    provide(notificationInjection, notificationConsumer)

    return notificationConsumer
}

export function useNotification(): NotificationManager {
    return useNotificationConsumer()
}

export function useNotificationConsumer(): NotificationConsumer {
    return inject(notificationInjection)!
}

const notificationInjection: InjectionKey<NotificationConsumer> = Symbol()