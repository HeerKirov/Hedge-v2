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
    errorList: ErrorListItem[]
    warningList: WarningListItem[]
}

interface ErrorListItem {filepath: string, reason: "FILE_NOT_FOUND" | "ILLEGAL_FILE_EXTENSION"}
interface WarningListItem {id: number, filepath: string, reason: "INVALID_REGEX"}

export const [installImportService, useImportService] = installation(function(): ImportService {
    const httpClient = useHttpClient()
    const notification = useNotification()

    const progress = reactive({value: 0, max: 0})

    const isProgressing = computed(() => progress.max > 0)

    const errorList = reactive<ErrorListItem[]>([])

    const warningList = reactive<WarningListItem[]>([])

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
                        warningList.push({id, filepath, reason: "INVALID_REGEX"})
                    }
                }else if(res.exception) {
                    if(res.exception.code === "FILE_NOT_FOUND" || res.exception.code === "ILLEGAL_FILE_EXTENSION") {
                        errorList.push({filepath, reason: res.exception.code})
                    }else{
                        notification.handleException(res.exception)
                    }
                }
                progress.value += 1
            }

            if(progress.value >= progress.max) {
                progress.max = 0
                progress.value = 0
            }
        }
    }

    return {openDialog, isProgressing, progress, errorList, warningList}
})
