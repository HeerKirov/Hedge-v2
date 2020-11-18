import { systemPreferences } from "electron"
import { AppDataDriver, AppDataStatus } from "../appdata"

/**
 * 对登录状态进行管理。
 * 尽管这个业务超级简单，但还是拆出来了一个单独的组件。因为windowManager依赖此业务，但service依赖windowManager，如果不拆会有循环依赖，拆了更好处理。
 */
export interface StateManager {
    /**
     * 初始化。主要是判断一下是否需要密码登录，如果不需要就自动登录。
     */
    load(): Promise<void>

    /**
     * 查看登录状态。
     */
    isLogin(): boolean

    /**
     * 使用密码登录。
     * @param password
     */
    login(password?: string): boolean

    /**
     * 使用touchID登录。
     */
    loginByTouchID(): Promise<boolean>
}

export function createStateManager(appdata: AppDataDriver): StateManager {
    let isLogin = false

    return {
        async load(): Promise<void> {
            if(appdata.status() == AppDataStatus.LOADED && appdata.getAppData().loginOption.password == null) {
                //如果登录不需要密码就直接设置isLogin为true
                isLogin = true
            }
        },
        isLogin(): boolean {
            return isLogin
        },
        login(password?: string): boolean {
            const truePassword = appdata.getAppData().loginOption.password
            if(truePassword == null || password === truePassword) {
                isLogin = true
                return true
            }
            return false
        },
        async loginByTouchID(): Promise<boolean> {
            if(systemPreferences.canPromptTouchID()) {
                try {
                    await systemPreferences.promptTouchID("登录")
                }catch (e) {
                    return false
                }
                isLogin = true
                return true
            }else{
                return false
            }
        }
    }
}
