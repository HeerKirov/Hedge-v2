import { Invoke, RegisterWindowEvents, WindowEvents } from ".";

export function inject(): {invoke: Invoke, registerWindowEvents: RegisterWindowEvents} {
    return {
        invoke: invokeHTTP,
        registerWindowEvents: registerDocumentEvents
    }
}

function invokeHTTP(channelName: string, method: string, meta: unknown, req: unknown): Promise<unknown> {
    //TODO web implement
    return null
}

function registerDocumentEvents(events: WindowEvents) {
    //似乎并没有可以注册的方法
}