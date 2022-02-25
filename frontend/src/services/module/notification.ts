import { clientMode } from "@/services/app"

/**
 * 发送一条系统级通知消息。
 */
export const sendNotification = clientMode ? newNotification : async function (title: string, content: string | null | undefined) {
    // 检查用户是否同意接受通知
    if(Notification.permission === "denied") {
        return
    }else if(Notification.permission === "default") {
        const permission = await Notification.requestPermission()
        if(permission !== "granted") {
            //用户阻止了消息发送
            return
        }
    }

    newNotification(title, content)
}

function newNotification(title: string, content: string | null | undefined) {
    new Notification(title, {body: content ?? undefined})
}
