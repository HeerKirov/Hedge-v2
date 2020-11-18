import { inject } from "vue"
import { ResourceStatus } from '../adapter-ipc/definition'
import { BasicComponentInjection } from './install'

/** 提供app resource的管理接入。 */
export function useAppResource(): AppResource {
    const { clientMode, ipc } = inject(BasicComponentInjection)!

    if(!clientMode) {
        return {
            main: {
                needUpdate: false,
                update() { throw new Error("Cannot call IPC in web.") }
            },
            cli: {}
        }
    }

    const ipcServerStatus = ipc.resource.server.status().status
    //client已在一个ipc channel中实现对全部种类资源的状态检查和更新，不需要前端再处理。
    const needUpdate = ipcServerStatus === ResourceStatus.NEED_UPDATE || ipcServerStatus === ResourceStatus.NOT_INIT
    const update = async () => {
        await ipc.resource.server.update()
    }

    return {
        main: {
            needUpdate,
            update
        },
        cli: {}
    }
}

export interface AppResource {
    /** 主资源管理，也包括一部分的cli。 */
    main: {
        /** 查看资源是否需要升级。这也是个不变值，也是因为它的应用场景不需要响应，也无法响应。 */
        needUpdate: boolean
        /** 对资源进行升级。 */
        update(): Promise<void>
    },
    /** 对cli的专门管理。 */
    cli: {}
}