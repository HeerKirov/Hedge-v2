import { defineComponent } from "vue"
import DialogBox from "@/layouts/layouts/DialogBox"
import { ImageCompareTable } from "@/layouts/displays"
import { useFindSimilarContext } from "./inject"
import { useObjectEndpoint } from "@/functions/utils/endpoints/object-endpoint"
import style from "./style.module.scss"

export default defineComponent({
    setup() {
        const { pane: { detailMode, closePane } } = useFindSimilarContext()

        const { data } = useObjectEndpoint({
            path: detailMode,
            get: httpClient => httpClient.findSimilar.result.get
        })

        return () => <DialogBox visible={detailMode.value !== null} onClose={closePane}>
            <div class={style.detail}>
                <div class={style.infoContent}>
                    {data.value && <ImageCompareTable columnNum={data.value.images.length} ids={data.value.images.map(i => i.id)}/>}
                </div>
                <div class={style.actionContent}>
                    
                </div>
            </div>
        </DialogBox>
    }
})
