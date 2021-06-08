import { defineComponent } from "vue"
import { SourceInfo, TagmeInfo } from "@/layouts/display-components"
import { PaneBasicLayout } from "@/layouts/layouts/SplitPane"
import { useMessageBox } from "@/functions/document/message-box"
import { useObjectEndpoint } from "@/functions/utils/endpoints/object-endpoint"
import { Tagme } from "@/functions/adapter-http/impl/illust"
import { DetailImportImage, ImportUpdateForm } from "@/functions/adapter-http/impl/import"
import { assetsUrl } from "@/functions/app"
import { objects } from "@/utils/primitives"
import { date, datetime, LocalDateTime } from "@/utils/datetime"
import { useImportContext } from "./inject"
import style from "./style.module.scss"

export default defineComponent({
    setup() {
        const message = useMessageBox()
        const { pane: { detailMode, closePane }, list } = useImportContext()

        const { data, setData } = useObjectEndpoint<number, DetailImportImage, ImportUpdateForm>({
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
                {data.value.fileName && <p class={[style.filename, "can-be-selected"]}><b>{data.value.fileName}</b></p>}
                {data.value.fileCreateTime && <p class="has-text-grey">文件创建时间 {datetime.toSimpleFormat(data.value.fileCreateTime)}</p>}
                {data.value.fileUpdateTime && <p class="has-text-grey">文件修改时间 {datetime.toSimpleFormat(data.value.fileUpdateTime)}</p>}
                {data.value.fileImportTime && <p class="has-text-grey">文件导入时间 {datetime.toSimpleFormat(data.value.fileImportTime)}</p>}
                <div class={style.separator}/>
                <SourceInfo source={data.value.source} sourceId={data.value.sourceId} sourcePart={data.value.sourcePart}/>
                <div class={style.spacing}/>
                <TagmeInfo value={data.value.tagme}/>
                <div class={style.spacing}/>
                {data.value.partitionTime && <p class={["has-text-grey", style.char2Left]}>分区 {date.toISOString(data.value.partitionTime)}</p>}
                {data.value.createTime && <p class="has-text-grey">创建时间 {datetime.toSimpleFormat(data.value.createTime)}</p>}
                {data.value.orderTime && <p class="has-text-grey">排序时间 {datetime.toSimpleFormat(data.value.orderTime)}</p>}
            </>}
        </PaneBasicLayout>
    }
})
