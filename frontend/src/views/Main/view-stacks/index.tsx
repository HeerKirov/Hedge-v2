import { SingletonDataView, SliceDataView } from "@/functions/utils/endpoints/query-endpoint"
import { Illust } from "@/functions/adapter-http/impl/illust"
import ImageDetailView from "./ImageDetailView"
import CollectionDetailView from "./CollectionDetailView"
import { defineViewStackComponents } from "./Components"
export { BackspaceButton } from "./BackspaceButton"

/* TODO view stacks待解决的问题
        2. 需要处理"view内容被删除后需要自动回退"的问题。
        3. 需要实现"view内容向上一层级传递回调消息"(例如preview通知list最后浏览的对象)的功能。
 */

export type StackViewInfo = {
    type: "image"
    data: SliceDataView<Illust>
    currentIndex: number
} | {
    type: "collection"
    data: SingletonDataView<Illust> | number
} | {
    type: "album"
    albumId: SingletonDataView<number>
}

export const { ViewStack, installViewStack, useViewStack } = defineViewStackComponents({
    slots(info: StackViewInfo) {
        return info.type === "image" ? <ImageDetailView data={info.data} currentIndex={info.currentIndex}/>
            : info.type === "collection" ? <CollectionDetailView data={info.data}/>
            : undefined
    },
    operations({ stacks }) {
        return {
            openImageView(data: SliceDataView<Illust>, currentIndex: number) {
                stacks.value.push({type: "image", data, currentIndex})
            },
            openCollectionView(data: SingletonDataView<Illust> | number) {
                stacks.value.push({type: "collection", data})
            }
        }
    }
})
