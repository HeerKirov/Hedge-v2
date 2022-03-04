import { computed, onBeforeUnmount, onMounted, reactive, Ref } from "vue"
import { useHttpClient } from "@/services/app"
import { dialogManager } from "@/services/module/dialog"
import { useToast } from "@/services/module/toast"
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
    const toast = useToast()

    const progress = reactive({value: 0, max: 0})

    const isProgressing = computed(() => progress.max > 0)

    const warningList: {id: number, filepath: string}[] = []

    const addFiles = async (files: string[]) => {
        progress.max += files.length

        for await (const filepath of files) {
            //FUTURE: 在web dialog module完成后添加upload API支持
            const res = await httpClient.import.import({filepath})
            if(res.ok) {
                const { id, warnings } = res.data
                if(warnings.length) {
                    warningList.push({id, filepath})
                }
            }else{
                if(res.exception.code === "FILE_NOT_FOUND") {
                    toast.toast("错误", "danger", `文件${filepath}不存在。`)
                }else if(res.exception.code === "ILLEGAL_FILE_EXTENSION") {
                    toast.toast("错误", "danger", `文件${filepath}的类型不适用。`)
                }else{
                    toast.handleException(res.exception)
                }
            }
            progress.value += 1
        }

        if(progress.value >= progress.max) {
            progress.max = 0
            progress.value = 0

            if(warningList.length) {
                if(warningList.length > 3) {
                    toast.toast("来源信息分析失败", "warning", `超过${warningList.length}个文件的来源信息分析失败，可能是因为正则表达式内容错误。`)
                }else{
                    toast.toast("来源信息分析失败", "warning", "存在文件的来源信息分析失败，可能是因为正则表达式内容错误。")
                }
                warningList.splice(0, warningList.length)
            }
        }
    }

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
            await addFiles(files)
        }
    }

    const onDocumentDragover = (e: DragEvent) => {
        e.preventDefault()
    }
    const onDocumentDrop = (e: DragEvent) => {
        if(e.dataTransfer?.files.length) {
            const files: string[] = []
            for(let i = 0; i < e.dataTransfer.files.length; ++i) {
                //tips: 此处的path由electron上下文注入，因此此写法仅适用于client mode
                files[i] = (e.dataTransfer.files.item(i) as any).path
            }
            addFiles(files).finally()
        }
    }

    onMounted(() => {
        document.addEventListener("dragover", onDocumentDragover)
        document.addEventListener("drop", onDocumentDrop)
    })

    onBeforeUnmount(() => {
        document.removeEventListener("dragover", onDocumentDragover)
        document.removeEventListener("drop", onDocumentDrop)
    })

    return {openDialog, isProgressing, progress}
})
