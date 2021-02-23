import { inject, InjectionKey, provide, reactive } from "vue"

export type NotificationType = "success" | "warning" | "danger" | "info" | "plain"

export interface NotificationManager {
    notify(title: string, type: NotificationType, content: string | string[] | undefined): void
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

export function installNotificationManager() {
    let seq = 0

    const notifications = reactive<Notification[]>([])

    const notify = (title: string, type: NotificationType, content: string | string[] | undefined) => {
        notifications.push({uniqueKey: seq++, title, type, content: typeof content === "string" ? [content] : content ?? []})
    }

    provide(notificationInjection, {
        notifications,
        notify
    })
}

export function useNotification(): NotificationManager {
    return useNotificationConsumer()
}

export function useNotificationConsumer(): NotificationConsumer {
    return inject(notificationInjection)!
}

const notificationInjection: InjectionKey<NotificationConsumer> = Symbol()