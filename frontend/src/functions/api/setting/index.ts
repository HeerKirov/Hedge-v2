import { useReactiveEndpoint } from "@/functions/utils/endpoints/reactive-endpoint"
import { WebOption } from "@/functions/adapter-http/impl/setting-web"
import { ServiceOption } from "@/functions/adapter-http/impl/setting-service"
import { ProxyOption } from "@/functions/adapter-http/impl/setting-proxy"
import { ImportOption } from "@/functions/adapter-http/impl/setting-import"
import { MetaOption } from "@/functions/adapter-http/impl/setting-meta"
import { QueryOption } from "@/functions/adapter-http/impl/setting-query"
import { FindSimilarOption } from "@/functions/adapter-http/impl/setting-find-similar"
export { installSettingSite, useSettingSite } from "./site"

export function useSettingWeb() {
    return useReactiveEndpoint<WebOption>({
        get: client => client.settingWeb.get,
        update: client => client.settingWeb.update
    })
}

export function useSettingService() {
    return useReactiveEndpoint<ServiceOption>({
        get: client => client.settingService.get,
        update: client => client.settingService.update
    })
}

export function useSettingProxy() {
    return useReactiveEndpoint<ProxyOption>({
        get: client => client.settingProxy.get,
        update: client => client.settingProxy.update
    })
}

export function useSettingMeta() {
    return useReactiveEndpoint<MetaOption>({
        get: client => client.settingMeta.get,
        update: client => client.settingMeta.update
    })
}

export function useSettingQuery() {
    return useReactiveEndpoint<QueryOption>({
        get: client => client.settingQuery.get,
        update: client => client.settingQuery.update
    })
}

export function useSettingImport() {
    return useReactiveEndpoint<ImportOption>({
        get: client => client.settingImport.get,
        update: client => client.settingImport.update
    })
}

export function useSettingFindSimilar() {
    return useReactiveEndpoint<FindSimilarOption>({
        get: client => client.settingFindSimilar.get,
        update: client => client.settingFindSimilar.update
    })
}
