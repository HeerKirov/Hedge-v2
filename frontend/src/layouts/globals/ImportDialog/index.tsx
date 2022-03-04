import { defineComponent } from "vue"
import DialogBox from "@/components/data/DialogBox"
import { useImportService } from "@/services/api/import"
import style from "./style.module.scss"

export const ImportDialog = defineComponent({
    setup() {
        const { isProgressing, progress } = useImportService()

        return () => <DialogBox visible={isProgressing.value} closeOnClickBackground={false} closeOnEscape={false}>
            <div class={style.dialogContent}>
                <div class={style.loadingBox}>
                    <label class="label">正在导入</label>
                    <p>{progress.value}/{progress.max}</p>
                    <progress class="progress is-info is-small" value={progress.value} max={progress.max}/>
                </div>
            </div>
        </DialogBox>
    }
})
