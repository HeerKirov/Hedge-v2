import { defineComponent } from "vue"
import ThumbnailImage from "@/components/elements/ThumbnailImage"
import { PaneBasicLayout } from "@/components/layouts/SplitPane"
import { SourceStatusEditor, VAEDisplay, VAEEditor, ViewAndEditor } from "@/layouts/editors"
import {
    SourceInfo, TitleDisplay, DescriptionDisplay,
    SourceRelationsDisplay, SourceTagListDisplay, TimeDisplay, SourceStatusDisplay
} from "@/layouts/displays"
import { useRouterNavigator } from "@/services/global/router"
import { useObjectEndpoint } from "@/functions/endpoints/object-endpoint"
import { SourceImageStatus } from "@/functions/adapter-http/impl/source-image"
import { useSourceImageContext } from "./inject"

export default defineComponent({
    setup() {
        const navigator = useRouterNavigator()
        const { pane: { detailMode, closePane } } = useSourceImageContext()

        const { data, setData } = useObjectEndpoint({
            path: detailMode,
            get: httpClient => httpClient.sourceImage.get,
            update: httpClient => httpClient.sourceImage.update
        })

        const { data: imagesData } = useObjectEndpoint({
            path: detailMode,
            get: httpClient => httpClient.sourceImage.getRelatedImages
        })

        const setSourceStatus = async (status: SourceImageStatus) => {
            return (status === data.value?.status) || await setData({status})
        }

        const gotoIllust = () => {
            if(data.value !== null) {
                navigator.goto({routeName: "MainIllusts", params: {source: {site: data.value.source, id: data.value.sourceId}}})
            }
        }

        return () => <PaneBasicLayout onClose={closePane}>
            {detailMode.value && <SourceInfo class="my-2" {...detailMode.value}/>}
            {(imagesData.value && imagesData.value.length > 0) ? <>
                <ThumbnailImage value={imagesData.value[0].thumbnailFile} minHeight="12rem" maxHeight="30rem"/>
                <p class="w-100 has-text-right">
                    <a class="no-wrap" onClick={gotoIllust}>{imagesData.value.length > 1 ? `在图库查看全部的${imagesData.value.length}个项目` : "在图库查看此项目"}<i class="fa fa-angle-double-right ml-1 mr-1"/></a>
                </p>
            </> : null}
            {data.value && <>
                <ViewAndEditor class="mt-2 mb-1" data={data.value.status} onSetData={setSourceStatus} color="deep-light" v-slots={{
                    default: ({ value }: VAEDisplay<SourceImageStatus>) => <SourceStatusDisplay value={value}/>,
                    editor: ({ value, setValue }: VAEEditor<SourceImageStatus>) => <SourceStatusEditor value={value} onUpdateValue={setValue}/>
                }}/>
                <TitleDisplay value={data.value.title}/>
                <DescriptionDisplay value={data.value.description}/>
                <SourceRelationsDisplay relations={data.value.relations} pools={data.value.pools}/>
                <SourceTagListDisplay value={data.value.tags}/>
                <TimeDisplay class="mt-1" createTime={data.value.createTime} updateTime={data.value.updateTime}/>
            </>}
        </PaneBasicLayout>
    }
})
