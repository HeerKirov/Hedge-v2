import { onMounted, ref } from "vue"
import { useHttpClient } from "@/functions/app"
import { useToast } from "@/functions/module/toast"
import { useMessageBox } from "@/functions/module/message-box"
import { simpleInstallation } from "@/functions/utils/basic"
import { Site } from "@/functions/adapter-http/impl/setting-source"

export const [installSettingSite, useSettingSite] = simpleInstallation(function() {
    const httpClient = useHttpClient()
    const notification = useToast()
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
                messageBox.showOkMessage("prompt", "已经存在同名的站点。")
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
                    "SpiderRule": "来源数据爬虫规则"
                }[res.exception.info]
                messageBox.showOkMessage("prompt", "无法删除此站点。", `此站点仍存在关联的${resourceName}，请先清理关联项，确保没有意外的级联删除。`)
            }else{
                notification.handleException(res.exception)
            }
        }
        return false
    }

    return {data, createItem, updateItem, deleteItem}
})
