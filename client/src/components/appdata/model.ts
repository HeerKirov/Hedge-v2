export interface AppData {
    /**
     * 版本号
     */
    version: string
    /**
     * 用户相关，主要是认证选项
     */
    userOption: UserOption
    /**
     * web服务相关
     */
    webOption: WebOption
    /**
     * 已注册的数据库存储
     */
    databases: Database[]
    /**
     * 上一次使用的数据库的path
     */
    lastDatabasePath: string | null
}

export interface UserOption {
    /**
     * 登录口令。null表示不需要口令。
     */
    password: string | null
    /**
     * 在macOS平台下，允许通过touchID认证。
     */
    touchID: boolean
}

export interface WebOption {
    /**
     * web服务在哪个端口上放通。
     * 可以填写端口、端口列表、端口范围，如"8080", "8080,8090,9000", "8000-8020", "8000, 8010-8020"。
     * 可以填写null，表示无限制，由系统自行尝试。
     */
    port: string | null
    /**
     * 在登录进入系统后，自动启动web服务。
     */
    autoWebAccess: boolean
    /**
     * 使用web服务需要密码。
     * 默认使用的是与登录口令相同的密码。
     */
    needPassword: boolean
    /**
     * 指定时，web服务使用与登录口令不同的独立密码
     */
    independentPassword: string | null
}

export interface Database {
    /**
     * 此数据库的显示名称。
     */
    name: string
    /**
     * 此数据库的描述。null表示没有。
     */
    description: string | null
    /**
     * 此数据库在文件系统中的存储路径。path是数据库唯一性判断的标准。
     */
    path: string
}

export function defaultValue(): AppData {
    return {
        version: "0.0.0",
        userOption: {
            password: null,
            touchID: false
        },
        webOption: {
            port: null,
            autoWebAccess: false,
            needPassword: true,
            independentPassword: null
        },
        databases: [],
        lastDatabasePath: null
    }
}
