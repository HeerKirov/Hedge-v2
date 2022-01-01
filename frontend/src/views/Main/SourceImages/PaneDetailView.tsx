import { defineComponent } from "vue"
import ThumbnailImage from "@/components/elements/ThumbnailImage"
import { PaneBasicLayout } from "@/layouts/layouts/SplitPane"
import { SourceInfo, TitleDisplay, DescriptionDisplay, SourceRelationsDisplay, SourceTagListDisplay, TimeDisplay } from "@/layouts/displays"
import { useObjectEndpoint } from "@/functions/utils/endpoints/object-endpoint"
import { useSourceImageContext } from "./inject"

export default defineComponent({
    setup() {
        const { pane: { detailMode, closePane } } = useSourceImageContext()

        const { data } = useObjectEndpoint({
            path: detailMode,
            get: httpClient => httpClient.sourceImage.get
        })

        const { data: imagesData } = useObjectEndpoint({
            path: detailMode,
            get: httpClient => httpClient.sourceImage.getRelatedImages
        })

        return () => <PaneBasicLayout onClose={closePane}>
            {detailMode.value && <SourceInfo class="my-2" {...detailMode.value}/>}
            {(imagesData.value && imagesData.value.length > 0) ? <>
                <ThumbnailImage value={imagesData.value[0].thumbnailFile} minHeight="12rem" maxHeight="30rem"/>
                <p class="w-100 has-text-right">
                    <a class="no-wrap">{imagesData.value.length > 1 ? `在图库查看全部的${imagesData.value.length}个项目` : "在图库查看此项目"}<i class="fa fa-angle-double-right ml-1 mr-1"/></a>
                </p>
            </> : null}
            {data.value && <>
                <TitleDisplay value={data.value.title}/>
                <DescriptionDisplay value={data.value.description}/>
                <SourceRelationsDisplay relations={data.value.relations} pools={data.value.pools}/>
                <SourceTagListDisplay value={data.value.tags}/>
                <TimeDisplay class="mt-1" createTime={data.value.createTime} updateTime={data.value.updateTime}/>
            </>}
        </PaneBasicLayout>
    }
})
