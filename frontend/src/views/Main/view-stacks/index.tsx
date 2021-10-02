import { SingletonDataView, SliceDataView, createInvokeSingleton } from "@/functions/utils/endpoints/query-endpoint"
import { ModifiedEvent } from "@/functions/utils/endpoints/query-endpoint/instance"
import { useFastObjectEndpoint } from "@/functions/utils/endpoints/object-fast-endpoint"
import { Illust } from "@/functions/adapter-http/impl/illust"
import ImageDetailView from "./ImageDetailView"
import CollectionDetailView from "./CollectionDetailView"
import { defineViewStackComponents } from "./Components"
export { BackspaceButton } from "./BackspaceButton"

export type StackViewInfo = StackViewImageInfo | StackViewCollectionInfo | StackViewAlbumInfo
interface StackViewImageInfo {
    type: "image"
    data: SliceDataView<Illust>
    currentIndex: number
    currentIndexModified?: ModifiedCallback
    modifiedEvent(e: ModifiedEvent<Illust>): void
}
interface StackViewCollectionInfo {
    type: "collection"
    data: SingletonDataView<Illust>
    toastRefresh?: ToastRefreshCallback
    modifiedEvent(e: ModifiedEvent<Illust>): void
}
interface StackViewAlbumInfo {
    type: "album"
    albumId: SingletonDataView<number>
}

interface ModifiedCallback {
    updateValue(index: number): void
    backspaceCallback(): void
}

interface ToastRefreshCallback {
    trigger(): void
    backspaceCallback(): void
}

export const { ViewStack, installViewStack, useViewStack } = defineViewStackComponents({
    slots(info: StackViewInfo) {
        if(info.type === "image") {
            return <ImageDetailView data={info.data} currentIndex={info.currentIndex} onUpdateCurrentIndex={info.currentIndexModified?.updateValue}/>
        }else if(info.type === "collection") {
            return <CollectionDetailView data={info.data} onToastRefresh={info.toastRefresh?.trigger}/>
        }
        return undefined
    },
    operations({ push, close }) {
        const { getData: getCollectionDetail } = useFastObjectEndpoint({ get: httpClient => httpClient.illust.collection.get })

        const generateCollectionData = (data: SingletonDataView<Illust> | number): SingletonDataView<Illust> => {
            if(typeof data === "number") {
                return createInvokeSingleton(async () => {
                    const d = await getCollectionDetail(data)
                    return d && {
                        id: d.id,
                        file: d.file,
                        thumbnailFile: d.thumbnailFile,
                        score: d.score,
                        favorite: d.favorite,
                        tagme: d.tagme,
                        orderTime: d.orderTime,
                        type: "COLLECTION",
                        childrenCount: 0
                    }
                })
            }
            return data
        }

        return {
            openImageView(data: SliceDataView<Illust>, currentIndex: number, onIndexModified?: (modifiedIndex: number) => void) {
                //index modified机制：通过组件的update事件调用{updateValue}回调，以记录组件更改currentIndex的行为；
                //index modified回调：在关闭视图时，回调{onIndexModified}函数，将更改后的currentIndex通过传入的回调函数通知到上级。
                let modifiedIndex: number | null = null
                const currentIndexModified: ModifiedCallback | undefined = onIndexModified && {
                    updateValue(index: number) {
                        modifiedIndex = index
                    },
                    backspaceCallback() {
                        if(modifiedIndex !== null) {
                            onIndexModified(modifiedIndex)
                        }
                    }
                }
                //内容变更监听机制：监听到内容列表清零就自动关闭
                const modifiedEvent = (e: ModifiedEvent<Illust>) => {
                    if(e.type === "remove" && data.count() <= 0) {
                        close(info)
                    }
                }
                data.syncOperations.modified.addEventListener(modifiedEvent)
                //push stack
                const info: StackViewImageInfo = {type: "image", data, currentIndex, currentIndexModified, modifiedEvent}
                push(info)
            },
            openCollectionView(data: SingletonDataView<Illust> | number, onToastRefresh?: () => void) {
                //先处理data，如果data是illustId就请求数据并处理成illust model
                const finalData = generateCollectionData(data)
                if(finalData !== undefined) {
                    //toast refresh机制：如果有刷新通知，则需要在返回上级时刷新
                    let isToastRefresh = false
                    const toastRefresh: ToastRefreshCallback | undefined = onToastRefresh && {
                        trigger() {
                            isToastRefresh = true
                        },
                        backspaceCallback() {
                            if(isToastRefresh) {
                                onToastRefresh()
                            }
                        }
                    }
                    //内容变更监听机制：监听到内容列表清零就自动关闭
                    const modifiedEvent = (e: ModifiedEvent<Illust>) => {
                        if(e.type === "remove" && finalData.get() === undefined) {
                            close(info)
                        }
                    }
                    finalData.syncOperations.modified.addEventListener(modifiedEvent)
                    const info: StackViewCollectionInfo = {type: "collection", data: finalData, toastRefresh, modifiedEvent}
                    push(info)
                }
            }
        }
    },
    onClose(info: StackViewInfo) {
        if(info.type === "image") {
            info.data.syncOperations.modified.removeEventListener(info.modifiedEvent)
            info.currentIndexModified?.backspaceCallback()
        }else if(info.type === "collection") {
            info.data.syncOperations.modified.removeEventListener(info.modifiedEvent)
            info.toastRefresh?.backspaceCallback()
        }
    }
})
