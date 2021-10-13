import { defineComponent } from "vue"
import { PaneBasicLayout } from "@/layouts/layouts/SplitPane"
import { SourceInfo, TitleDisplay, DescriptionDisplay, SourceRelationsDisplay, SourceTagListDisplay } from "@/layouts/displays"
import { DetailSourceImage } from "@/functions/adapter-http/impl/source-image"
import { useObjectEndpoint } from "@/functions/utils/endpoints/object-endpoint"
import { useMessageBox } from "@/functions/module/message-box"
import { useSourceImageContext } from "./inject"
import style from "./style.module.scss"

export default defineComponent({
    setup() {
        const message = useMessageBox()
        const { pane: { detailMode, closePane } } = useSourceImageContext()

        const { data, setData } = useObjectEndpoint({
            path: detailMode,
            get: httpClient => httpClient.sourceImage.get,
            update: httpClient => httpClient.sourceImage.update,
            afterUpdate(key, data: DetailSourceImage) {

            }
        })

        return () => <PaneBasicLayout onClose={closePane} class={style.paneDetailContent}>
            {detailMode.value && <SourceInfo class="my-2" {...detailMode.value}/>}
            {data.value && <>
                <TitleDisplay value={data.value.title}/>
                <DescriptionDisplay value={data.value.description}/>
                <SourceRelationsDisplay parents={data.value.parents} children={data.value.children} pools={data.value.pools}/>
                <SourceTagListDisplay value={data.value.tags}/>
            </>}
        </PaneBasicLayout>
    }
})
