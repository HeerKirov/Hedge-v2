import { onMounted, ref } from "vue"
import { WebOption } from "@/functions/adapter-http/impl/setting-web"
import { ServiceOption } from "@/functions/adapter-http/impl/setting-service"
import { ProxyOption } from "@/functions/adapter-http/impl/setting-proxy"
import { ImportOption } from "@/functions/adapter-http/impl/setting-import"
import { MetaOption } from "@/functions/adapter-http/impl/setting-meta"
import { QueryOption } from "@/functions/adapter-http/impl/setting-query"
import { Site } from "@/functions/adapter-http/impl/setting-source"
import { FindSimilarOption } from "@/functions/adapter-http/impl/setting-find-similar"
import { useReactiveEndpoint } from "@/functions/endpoints/reactive-endpoint"
import { optionalInstallation } from "@/functions/utils/basic"
import { useHttpClient } from "@/services/app"
import { useToast } from "@/services/module/toast"
import { useMessageBox } from "@/services/module/message-box"

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

export const [installSettingSite, useSettingSite] = optionalInstallation(function() {
    const httpClient = useHttpClient()
    const toast = useToast()
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
        }else{
            if(res.exception.code === "ALREADY_EXISTS") {
                messageBox.showOkMessage("prompt", "已经存在同名的站点。")
            }else{
                toast.handleException(res.exception)
            }
        }
        return false
    }
    const updateItem = async (name: string, newTitle: string): Promise<boolean> => {
        const res = await httpClient.settingSource.site.update(name, {title: newTitle})
        if(res.ok) {
            await refreshData()
            return true
        }else{
            toast.handleException(res.exception)
        }
        return false
    }
    const deleteItem = async (name: string): Promise<boolean> => {
        const res = await httpClient.settingSource.site.delete(name)
        if(res.ok) {
            const i = data.value.findIndex(s => s.name === name)
            data.value.splice(i, 1)
            return true
        }else{
            if(res.exception.code == "CASCADE_RESOURCE_EXISTS") {
                const resourceName = {
                    "Illust": "图库项目",
                    "ImportImage": "导入项目",
                    "SourceAnalyseRule": "来源解析规则",
                    "SpiderRule": "来源数据爬虫规则"
                }[res.exception.info]
                messageBox.showOkMessage("prompt", "无法删除此站点。", `此站点仍存在关联的${resourceName}，请先清理关联项，确保没有意外的级联删除。`)
            }else{
                toast.handleException(res.exception)
            }
        }
        return false
    }

    return {data, createItem, updateItem, deleteItem}
})
