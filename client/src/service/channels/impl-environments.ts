import { ServiceContext, ServiceOptions } from ".."


export default {
    channels: [
        getPlatformInfo
    ]
}

function getPlatformInfo(context: ServiceContext, options: ServiceOptions) {
    return {
        name: 'platform',
        invokeSync() {
            return {
                platform: options.platform,
                debug: options.debugMode
            }
        }
    }
}
