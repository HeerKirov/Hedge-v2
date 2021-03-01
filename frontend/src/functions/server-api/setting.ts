import { onMounted, ref } from "vue"
import { useHttpClient } from "@/functions/service"
import { useMessageBox, useNotification } from "@/functions/message"
import { useReactiveEndpoint } from "@/functions/utils/reactive-endpoint"
import { WebOption } from "@/functions/adapter-http/impl/setting-web"
import { ServiceOption } from "@/functions/adapter-http/impl/setting-service"
import { ProxyOption } from "@/functions/adapter-http/impl/setting-proxy"
import { ImportOption } from "@/functions/adapter-http/impl/setting-import"
import { MetaOption } from "@/functions/adapter-http/impl/setting-meta"
import { QueryOption } from "@/functions/adapter-http/impl/setting-query"
import { Site, SpiderOption } from "@/functions/adapter-http/impl/setting-source"

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

export function useSettingSite() {
    const httpClient = useHttpClient()
    const notification = useNotification()
    const messageBox = useMessageBox()

    const data = ref<Site[]>([])

    onMounted(refreshData)
    async function refreshData() {
        const res = await httpClient.settingSource.site.list()
        if(res.ok) {
            data.value = res.data
        }
    }

    const createItem = async (site: Site): Promise<boolean> => {
        const res = await httpClient.settingSource.site.create(site)
        if(res.ok) {
            await refreshData()
            return true
        }else if(res.exception) {
            if(res.exception.code === "ALREADY_EXISTS") {
                messageBox.showOkMessage("错误", "已经存在同名的站点。")
            }else{
                notification.handleException(res.exception)
            }
        }
        return false
    }
    const updateItem = async (name: string, newTitle: string): Promise<boolean> => {
        const res = await httpClient.settingSource.site.update(name, {title: newTitle})
        if(res.ok) {
            await refreshData()
            return true
        }else if(res.exception) {
            notification.handleException(res.exception)
        }
        return false
    }
    const deleteItem = async (name: string): Promise<boolean> => {
        const res = await httpClient.settingSource.site.delete(name)
        if(res.ok) {
            const i = data.value.findIndex(s => s.name === name)
            data.value.splice(i, 1)
            return true
        }else if(res.exception) {
            if(res.exception.code == "CASCADE_RESOURCE_EXISTS") {
                const resourceName = {
                    "Illust": "图库项目",
                    "ImportImage": "导入项目",
                    "SourceAnalyseRule": "来源解析规则",
                    "SpiderRule": "原始数据爬虫规则"
                }[res.exception.info]
                messageBox.showOkMessage("无法删除", `此站点仍存在关联的${resourceName}，请先清理关联项，确保没有意外的级联删除。`)
            }else{
                notification.handleException(res.exception)
            }
        }
        return false
    }

    return {data, createItem, updateItem, deleteItem}
}

export function useSettingSpider() {
    return useReactiveEndpoint<SpiderOption>({
        get: client => client.settingSource.spider.get,
        update: client => client.settingSource.spider.update
    })
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