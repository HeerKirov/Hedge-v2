import { inject, InjectionKey, provide, reactive } from "vue"

export type NotificationType = "success" | "warning" | "danger" | "info" | "plain"

export interface NotificationManager {
    notify(title: string, type: NotificationType, content: string | string[] | undefined): void
    handleError(title: string, message: string): void
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
    const handleError = (title: string, message: string) => notify(title, "danger", message)

    const notificationConsumer = { notifications, notify, handleError }

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