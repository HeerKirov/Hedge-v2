import { computed, onMounted, Ref, ref } from "vue"
import { useHttpClient } from "@/functions/app"
import { useReactiveEndpoint } from "@/functions/utils/endpoints/reactive-endpoint"
import { WebOption } from "@/functions/adapter-http/impl/setting-web"
import { ServiceOption } from "@/functions/adapter-http/impl/setting-service"
import { ProxyOption } from "@/functions/adapter-http/impl/setting-proxy"
import { ImportOption } from "@/functions/adapter-http/impl/setting-import"
import { MetaOption } from "@/functions/adapter-http/impl/setting-meta"
import { QueryOption } from "@/functions/adapter-http/impl/setting-query"
import { Site, SpiderOption, SpiderRule } from "@/functions/adapter-http/impl/setting-source"
import { maps } from "@/utils/collections"

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

export function useSettingSpider(sites: Ref<Site[]>, selected: Ref<string | undefined>) {
    const { data: endpoint } = useReactiveEndpoint<SpiderOption>({
        get: client => client.settingSource.spider.get,
        update: client => client.settingSource.spider.update
    })

    const siteNameList = computed(() => {
        const d = endpoint.value
        if(d) {
            const map: {[key: string]: unknown} = {}
            for(const key in d.rules) map[key] = null
            for(const key in d.siteRules) map[key] = null
            return Object.keys(map).sort()
        }
        return []
    })
    const siteList = computed(() => siteNameList.value.map(name => sites.value.find(site => site.name === name)).filter(site => site != undefined).map(site => site!))

    const publicRule = computed({
        get() { return endpoint.value?.publicRule },
        set(value: SpiderRule | undefined) {
            if(value) {
                endpoint.value!.publicRule = value
            }
        }
    })

    const selectedSite = computed({
        get() {
            const d = endpoint.value
            if(selected.value && d) {
                const rule = d.rules[selected.value]
                const options = d.siteRules[selected.value]
                return {rule, options}
            }
            return undefined
        },
        set(value: {rule: string, options: SpiderRule | null} | undefined) {
            if(selected.value && endpoint.value) {
                if(value) {
                    const { rule, options } = value
                    endpoint.value = {
                        publicRule: endpoint.value!.publicRule,
                        rules: {...maps.filter(endpoint.value!.rules, k => k !== selected.value), [selected.value]: rule},
                        siteRules: options
                            ? {...maps.filter(endpoint.value!.siteRules, k => k !== selected.value), [selected.value]: options}
                            : maps.filter(endpoint.value!.siteRules, k => k !== selected.value)
                    }
                }else{
                    endpoint.value = {
                        publicRule: endpoint.value!.publicRule,
                        rules: maps.filter(endpoint.value!.rules, k => k !== selected.value),
                        siteRules: maps.filter(endpoint.value!.siteRules, k => k !== selected.value)
                    }
                }
            }
        }
    })

    return {siteList, publicRule, selectedSite}
}

export function useSettingSpiderUsableRules() {
    const httpClient = useHttpClient()

    const data = ref<{name: string, value: string}[]>([])

    onMounted(async () => {
        const res = await httpClient.settingSource.spider.getUsableRules()
        if(res.ok) {
            const list: {name: string, value: string}[] = []
            for (const [value, name] of Object.entries(res.data)) {
                list.push({value, name})
            }
            data.value = list
        }
    })

    return data
}
