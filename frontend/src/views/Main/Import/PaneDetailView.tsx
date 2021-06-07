import { defineComponent } from "vue"
import { PaneBasicLayout } from "@/layouts/layouts/SplitPane"
import { useMessageBox } from "@/functions/document/message-box"
import { useObjectEndpoint } from "@/functions/utils/endpoints/object-endpoint"
import { ImportImage, ImportUpdateForm } from "@/functions/adapter-http/impl/import"
import { assetsUrl } from "@/functions/app"
import { useImportContext } from "./inject"
import style from "./style.module.scss"

export default defineComponent({
    setup() {
        const message = useMessageBox()
        const { pane: { detailMode, closePane }, list } = useImportContext()

        const { data, setData } = useObjectEndpoint<number, ImportImage, ImportUpdateForm>({
            path: detailMode,
            get: httpClient => httpClient.import.get,
            update: httpClient => httpClient.import.update,
            afterUpdate(id, data) {
                const index = list.endpoint.operations.find(annotation => annotation.id === id)
                if(index != undefined) list.endpoint.operations.modify(index, data)
            }
        })

        return () => <PaneBasicLayout class={style.paneDetailContent} onClose={closePane}>
            {data.value && <>
                <p class={style.top}/>
                <div class={style.thumbnail}>
                    <img alt={data.value.fileName ?? undefined} src={assetsUrl(data.value.thumbnailFile)}/>
                </div>
                {data.value.fileName && <p class={style.filename}><b>{data.value.fileName}</b></p>}
            </>}
        </PaneBasicLayout>
    }
})
