import { useReactiveEndpoint } from "@/functions/restful"
import { SettingWeb } from "@/functions/adapter-http/impl/setting-web"
import { SettingService } from "@/functions/adapter-http/impl/setting-service"
import { SettingProxy } from "@/functions/adapter-http/impl/setting-proxy"
import { SettingImport } from "@/functions/adapter-http/impl/setting-import"

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

export function useSettingProxy() {
    return useReactiveEndpoint<SettingProxy>({
        get: client => client.settingProxy.get,
        update: client => client.settingProxy.update
    })
}

export function useSettingImport() {
    return useReactiveEndpoint<SettingImport>({
        get: client => client.settingImport.get,
        update: client => client.settingImport.update
    })
}