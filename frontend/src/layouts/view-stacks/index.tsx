import { SingletonDataView, SliceDataView, createInvokeSingleton } from "@/functions/utils/endpoints/query-endpoint"
import { ModifiedEvent } from "@/functions/utils/endpoints/query-endpoint/instance"
import { useFastObjectEndpoint } from "@/functions/utils/endpoints/object-fast-endpoint"
import { createSliceByInvoke } from "@/functions/utils/endpoints/query-endpoint/slice-data-view"
import { Illust } from "@/functions/adapter-http/impl/illust"
import { Album } from "@/functions/adapter-http/impl/album"
import ImageDetailView from "./ImageDetailView"
import CollectionDetailView from "./CollectionDetailView"
import AlbumDetailView from "./AlbumDetailView"
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
    data: SingletonDataView<Album>
    toastRefresh?: ToastRefreshCallback
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
        }else if(info.type === "album") {
            return <AlbumDetailView data={info.data} onToastRefresh={info.toastRefresh?.trigger}/>
        }
        return undefined
    },
    operations({ push, setRootView, close }) {
        const { getData: getCollectionDetail } = useFastObjectEndpoint({ get: httpClient => httpClient.illust.collection.get })
        const { getData: getAlbumDetail } = useFastObjectEndpoint({ get: httpClient => httpClient.album.get })
        const { getData: getImageByIds } = useFastObjectEndpoint({ get: httpClient => httpClient.illust.findByIds })

        const generateImagesData = (data: SliceDataView<Illust> | number[]): SliceDataView<Illust> => {
            if(data instanceof Array) {
                return createSliceByInvoke(async () => await getImageByIds(data) ?? [])
            }
            return data
        }

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
                        childrenCount: 0,
                        source: d.source,
                        sourceId: d.sourceId,
                        sourcePart: d.sourcePart
                    }
                })
            }
            return data
        }

        const generateAlbumData = (data: SingletonDataView<Album> | number): SingletonDataView<Album> => {
            if(typeof data === "number") {
                return createInvokeSingleton(async () => {
                    const d = await getAlbumDetail(data)
                    return d && {
                        id: d.id,
                        title: d.title,
                        imageCount: d.imageCount,
                        file: d.file,
                        thumbnailFile: d.thumbnailFile,
                        score: d.score,
                        favorite: d.favorite,
                        createTime: d.createTime,
                        updateTime: d.updateTime
                    }
                })
            }
            return data
        }

        return {
            openImageView(data: SliceDataView<Illust> | number[], currentIndex: number, onIndexModified?: (modifiedIndex: number) => void, isRootView?: boolean) {
                //index modified机制：通过组件的update事件调用{updateValue}回调，以记录组件更改currentIndex的行为；
                //index modified回调：在关闭视图时，回调{onIndexModified}函数，将更改后的currentIndex通过传入的回调函数通知到上级。
                const finalData = generateImagesData(data)
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
                    if(e.type === "remove" && finalData.count() <= 0) {
                        close(info)
                    }
                }
                finalData.syncOperations.modified.addEventListener(modifiedEvent)
                //push stack
                const info: StackViewImageInfo = {type: "image", data: finalData, currentIndex, currentIndexModified, modifiedEvent}
                const call = (isRootView ? setRootView : push)
                call(info)
            },
            openCollectionView(data: SingletonDataView<Illust> | number, onToastRefresh?: () => void, isRootView?: boolean) {
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
                    const call = (isRootView ? setRootView : push)
                    call(info)
                }
            },
            openAlbumView(data: SingletonDataView<Album> | number, onToastRefresh?: () => void, isRootView?: boolean) {
                //先处理data，如果data是albumId就请求数据并处理成illust model
                const finalData = generateAlbumData(data)
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
                    //tips: album没有内容列表清零就自动关闭的机制
                    const info: StackViewAlbumInfo = {type: "album", data: finalData, toastRefresh}
                    const call = (isRootView ? setRootView : push)
                    call(info)
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
        }else if(info.type === "album") {
            info.toastRefresh?.backspaceCallback()
        }
    }
})
