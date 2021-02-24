import { useReactiveEndpoint } from "@/functions/restful"
import { SettingWeb } from "@/functions/adapter-http/impl/setting-web"
import { SettingService } from "@/functions/adapter-http/impl/setting-service"

export function useSettingWeb() {
    return useReactiveEndpoint<SettingWeb>({
        get: client => client.settingWeb.get,
        update: client => client.settingWeb.update
    })
}

export function useSettingService() {
    return useReactiveEndpoint<SettingService>({
        get: client => client.settingService.get,
        update: client => client.settingService.update
    })
}