import { computed, reactive, Ref } from "vue"
import { useHttpClient } from "@/functions/app"
import { dialogManager, useNotification } from "@/functions/module"
import { installation } from "@/functions/utils/basic"

export interface ImportService {
    openDialog(): Promise<void>
    isProgressing: Ref<boolean>
    progress: {
        value: number,
        max: number
    }
}

export const [installImportService, useImportService] = installation(function(): ImportService {
    const httpClient = useHttpClient()
    const notification = useNotification()

    const progress = reactive({value: 0, max: 0})

    const isProgressing = computed(() => progress.max > 0)

    const warningList: {id: number, filepath: string}[] = []

    const openDialog = async () => {
        const files = await dialogManager.openDialog({
            title: "选择文件",
            filters: [
                {
                    name: "支持的文件格式(*.jpeg, *.jpg, *.png, *.gif, *.mp4, *.webm, *.ogv)",
                    extensions: ["jpeg", "jpg", "png", "gif", "mp4", "webm", "ogv"]
                }
            ],
            properties: ["openFile", "multiSelections", "createDirectory"]
        })

        if(files) {
            progress.max += files.length

            for await (const filepath of files) {
                const res = await httpClient.import.import({filepath})
                if(res.ok) {
                    const { id, warnings } = res.data
                    if(warnings.length) {
                        warningList.push({id, filepath})
                    }
                }else if(res.exception) {
                    if(res.exception.code === "FILE_NOT_FOUND") {
                        notification.notify("错误", "danger", `文件${filepath}不存在。`)
                    }else if(res.exception.code === "ILLEGAL_FILE_EXTENSION") {
                        notification.notify("错误", "danger", `文件${filepath}的类型不适用。`)
                    }else{
                        notification.handleException(res.exception)
                    }
                }
                progress.value += 1
            }

            if(progress.value >= progress.max) {
                progress.max = 0
                progress.value = 0

                if(warningList.length) {
                    if(warningList.length > 3) {
                        notification.notify("来源信息分析失败", "warning", `超过${warningList.length}个文件的来源信息分析失败，可能是因为正则表达式内容错误。`)
                    }else{
                        notification.notify("来源信息分析失败", "warning", ["存在文件的来源信息分析失败，可能是因为正则表达式内容错误。", ...warningList.map(i => i.filepath)])
                    }
                    warningList.splice(0, warningList.length)
                }
            }
        }
    }

    return {openDialog, isProgressing, progress}
})
