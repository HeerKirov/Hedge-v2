import { inject, InjectionKey, provide, reactive } from "vue"


export interface MessageBoxManager {
    showMessageBox(options: MessageBoxOptions): Promise<string>
    showOkMessage(titleType: StdTitleType, message: string, detailMessage?: string): void
    showYesNoMessage(titleType: StdTitleType, message: string, detailMessage?: string): Promise<boolean>
}

interface MessageBoxConsumer extends MessageBoxManager {
    messageTasks: MessageTask[]
}

export interface MessageBoxOptions {
    title: string
    message: string
    detailMessage?: string
    buttons: MessageBoxButton[]
    enter?: string
    esc?: string
}

export interface MessageBoxButton {
    name?: string
    action: string
    type?: "info" | "danger" | "warning"
    icon?: string
}

export interface MessageTask {
    options: MessageBoxOptions
    resolve(ret: string): void
}

export function installMessageBoxManager() {
    const messageTasks = reactive<MessageTask[]>([])

    const showMessageBox = (options: MessageBoxOptions): Promise<string> => {
        return new Promise<string>(resolve => {
            messageTasks.push({options, resolve})
        })
    }
    const showOkMessage = (titleType: StdTitleType, message: string, detailMessage?: string): void => {
        showMessageBox({title: stdTitles[titleType], message, detailMessage, buttons: [OkButton], esc: "ok", enter: "ok"}).finally(null)
    }
    const showYesNoMessage = async (titleType: StdTitleType, message: string, detailMessage?: string): Promise<boolean> => {
        const res = await showMessageBox({title: stdTitles[titleType], message, detailMessage, buttons: [YesButton, NoButton], enter: "yes", esc: "no"})
        return res === "yes"
    }

    const messageboxConsumer = <MessageBoxConsumer>{messageTasks, showMessageBox, showOkMessage, showYesNoMessage}

    provide(messageBoxInjection, messageboxConsumer)

    return messageboxConsumer
}


export function useMessageBox(): MessageBoxManager {
    return useMessageBoxConsumer()
}

export function useMessageBoxConsumer(): MessageBoxConsumer {
    return inject(messageBoxInjection)!
}

const messageBoxInjection: InjectionKey<MessageBoxConsumer> = Symbol()

const OkButton: MessageBoxButton = {name: "好", action: "ok", type: "info"}
const YesButton: MessageBoxButton = {name: "是", action: "yes", type: "info"}
const NoButton: MessageBoxButton = {name: "否", action: "no"}

type StdTitleType = "info" | "prompt" | "error" | "confirm" | "warn"

const stdTitles: {[key in StdTitleType]: string} = {
    "info": "消息",
    "prompt": "提示",
    "error": "错误",
    "confirm": "确认",
    "warn": "警告",
}
