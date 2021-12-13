import { defineComponent, onMounted, PropType, ref, Ref } from "vue"
import CheckBox from "@/components/forms/CheckBox"
import WrappedText from "@/components/elements/WrappedText"
import ThumbnailImage from "@/components/elements/ThumbnailImage"
import { PartitionTimeDisplay, ScoreDisplay, SourceInfo, TagmeInfo, TimeDisplay } from "@/layouts/displays"
import { DetailIllust, ImageOriginData, ImagePropsCloneForm, ImageRelatedItems } from "@/functions/adapter-http/impl/illust"
import { installSettingSite } from "@/functions/api/setting"
import { useHttpClient, useLocalStorageWithDefault } from "@/functions/app"
import { useToast } from "@/functions/module/toast"
import { useDroppable } from "@/functions/feature/drag"
import { useDialogSelfContext, useDialogServiceContext } from "../all"
import { MetaTagList, CollectionInfo, AlbumsInfo, FoldersInfo } from "./DisplayComponents"
import style from "./style.module.scss"
import { splitRef } from "@/functions/utils/basic";
import { arrays } from "@/utils/collections";

export interface CloneImageContext {
    /**
     * 打开一个对话框，执行图像关系克隆操作。
     * 可以预先指定from和to，也可以都不指定，在对话框里拖放解决。
     * 关系克隆操作可以选择要对哪些属性做克隆，以及要不要删除from图像。
     */
    clone(options: {from?: number, to?: number}, onSucceed?: (from: number, to: number, fromDeleted: boolean) => void)
}

export interface CloneImageInjectionContext {
    from: number | null
    to: number | null
    onSucceed?(from: number, to: number, fromDeleted: boolean): void
}

export const CloneImageContent = defineComponent({
    emits: ["close"],
    setup(_, { emit }) {
        const props = useDialogSelfContext("cloneImage")

        const fromImage = useImageInfo(props.from)
        const toImage = useImageInfo(props.to)

        const dropEventsOfFrom = useDropEvents(fromImage.setImageId)
        const dropEventsOfTo = useDropEvents(toImage.setImageId)

        const exchange = () => {
            function exchangeRefValue<T>(a: Ref<T>, b: Ref<T>) {
                const tmp = a.value
                a.value = b.value
                b.value = tmp
            }

            exchangeRefValue(fromImage.imageId, toImage.imageId)
            exchangeRefValue(fromImage.metadata, toImage.metadata)
            exchangeRefValue(fromImage.relatedItems, toImage.relatedItems)
            exchangeRefValue(fromImage.originData, toImage.originData)
        }

        const options = useOptions(fromImage.imageId, toImage.imageId, (fromId, toId, deleted) => {
            props.onSucceed?.(fromId, toId, deleted)
            emit("close")
        })

        return () => <div class={style.content}>
            <div class={style.infoContent}>
                <p class="mt-2 pl-1 is-size-medium w-100"><b>属性克隆</b></p>
                <p class="mb-2 pl-1 w-100">将源图像的属性、关联关系完整地(或有选择地)复制给目标图像。</p>
                <table class="table is-fullwidth mx-1">
                    <thead>
                        <tr>
                            <th class="is-width-15"/>
                            <th class="is-width-45">FROM</th>
                            <th class="is-width-45">TO</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td/>
                            <td><ThumbnailImage value={fromImage.metadata.value?.thumbnailFile} {...dropEventsOfFrom}/></td>
                            <td><ThumbnailImage value={toImage.metadata.value?.thumbnailFile} {...dropEventsOfTo}/></td>
                        </tr>
                    <MetadataInfo from={fromImage.metadata.value} to={toImage.metadata.value}/>
                    <RelatedItemsInfo from={fromImage.relatedItems.value} to={toImage.relatedItems.value}/>
                    <OriginDataInfo from={fromImage.originData.value} to={toImage.originData.value}/>
                    </tbody>
                </table>
            </div>
            <div class={style.actionContent}>
                <div class={style.scrollContent}>
                    <button class="button is-white w-100" onClick={exchange} disabled={fromImage.imageId.value === null && toImage.imageId.value === null}>
                        <span class="icon"><i class="fa fa-exchange-alt"/></span><span>交换源与目标</span>
                    </button>
                    <label class="label mt-2">选择克隆属性/关系</label>
                    {FORM_PROPS.map(key => <p class="mt-1"><CheckBox value={options.props[key].value} onUpdateValue={v => options.props[key].value = v}>{FORM_TITLE[key]}</CheckBox></p>)}
                    <label class="label mt-2">高级选项</label>
                    {FORM_OPTIONS.map(key => <p class="mt-1"><CheckBox value={options.options[key].value} onUpdateValue={v => options.options[key].value = v}>{FORM_TITLE[key]}</CheckBox></p>)}
                </div>
                <div class={style.bottom}>
                    <button class={`button is-${options.options.deleteFrom.value ? "danger" : "link"} w-100`}
                            disabled={fromImage.imageId.value === null || toImage.imageId.value === null}
                            onClick={options.execute}>
                        <span class="icon"><i class="fa fa-check"/></span><span>{options.options.deleteFrom.value ? "执行克隆并删除源图像" : "执行克隆"}</span>
                    </button>
                </div>
            </div>
        </div>
    }
})

const MetadataInfo = defineComponent({
    props: {
        from: {type: null as any as PropType<DetailIllust | null>, required: true},
        to: {type: null as any as PropType<DetailIllust | null>, required: true}
    },
    setup(props) {
        return () => <>
            <tr class="has-text-centered">
                <td>ID</td>
                <td>{props.from && <><i class="fa fa-id-card mr-2"/><b class="can-be-selected">{props.from.id}</b></>}</td>
                <td>{props.to && <><i class="fa fa-id-card mr-2"/><b class="can-be-selected">{props.to.id}</b></>}</td>
            </tr>
            {(props.from?.score || props.from?.favorite || props.to?.score || props.to?.favorite || undefined) && <tr class="has-text-centered">
                <td>评分/收藏</td>
                <td>
                    {props.from && <>
                        <ScoreDisplay class="is-inline-block" value={props.from?.score ?? null}/>
                        {props.from?.favorite && <i class="fa fa-heart has-text-danger ml-2"/>}
                    </>}
                </td>
                <td>
                    {props.to && <>
                        <ScoreDisplay class="is-inline-block" value={props.to?.score ?? null}/>
                        {props.to?.favorite && <i class="fa fa-heart has-text-danger ml-2"/>}
                    </>}
                </td>
            </tr>}
            {(props.from?.description || props.to?.description || undefined) && <tr class="has-text-centered">
                <td>描述</td>
                <td>{props.from && <WrappedText value={props.from?.description}/>}</td>
                <td>{props.to && <WrappedText value={props.to?.description}/>}</td>
            </tr>}
            {(props.from?.tagme || props.to?.tagme || undefined) && <tr class="has-text-centered">
                <td>Tagme</td>
                <td>{props.from && <TagmeInfo value={props.from?.tagme}/>}</td>
                <td>{props.to && <TagmeInfo value={props.to?.tagme}/>}</td>
            </tr>}
            {(props.from?.tags?.length || props.from?.topics?.length || props.from?.authors?.length
                || props.to?.tags?.length || props.to?.topics?.length || props.to?.authors?.length || undefined) && <tr class="has-text-centered">
                <td>标签</td>
                <td>{props.from && <MetaTagList tags={props.from?.tags} topics={props.from?.topics} authors={props.from?.authors}/>}</td>
                <td>{props.to && <MetaTagList tags={props.to?.tags} topics={props.to?.topics} authors={props.to?.authors}/>}</td>
            </tr>}
            {(props.from || props.to) && <tr class="has-text-centered">
                <td>时间</td>
                <td>
                    {props.from && <PartitionTimeDisplay partitionTime={props.from.partitionTime}/>}
                    <TimeDisplay createTime={props.from?.createTime} updateTime={props.from?.updateTime} orderTime={props.from?.orderTime}/>
                </td>
                <td>
                    {props.to && <PartitionTimeDisplay partitionTime={props.to.partitionTime}/>}
                    <TimeDisplay createTime={props.to?.createTime} updateTime={props.to?.updateTime} orderTime={props.to?.orderTime}/>
                </td>
            </tr>}
        </>
    }
})

const RelatedItemsInfo = defineComponent({
    props: {
        from: {type: null as any as PropType<ImageRelatedItems | null>, required: true},
        to: {type: null as any as PropType<ImageRelatedItems | null>, required: true}
    },
    setup(props) {
        return () => <>
            {(props.from?.collection || props.to?.collection || undefined) && <tr class="has-text-centered">
                <td>所属集合</td>
                <td>{props.from && <CollectionInfo parent={props.from?.collection}/>}</td>
                <td>{props.to && <CollectionInfo parent={props.to?.collection}/>}</td>
            </tr>}
            {(props.from?.albums?.length || props.to?.albums?.length || undefined) && <tr class="has-text-centered">
                <td>所属画集</td>
                <td>{props.from && <AlbumsInfo albums={props.from?.albums}/>}</td>
                <td>{props.to && <AlbumsInfo albums={props.to?.albums}/>}</td>
            </tr>}
            {(props.from?.folders?.length || props.to?.folders?.length || undefined) && <tr class="has-text-centered">
                <td>所属目录</td>
                <td>{props.from && <FoldersInfo folders={props.from?.folders}/>}</td>
                <td>{props.to && <FoldersInfo folders={props.to?.folders}/>}</td>
            </tr>}
        </>
    }
})

const OriginDataInfo = defineComponent({
    props: {
        from: {type: null as any as PropType<ImageOriginData | null>, required: true},
        to: {type: null as any as PropType<ImageOriginData | null>, required: true}
    },
    setup(props) {
        installSettingSite()

        return () => (props.from?.source || props.to?.source || undefined) && <tr class="has-text-centered">
            <td>来源</td>
            <td>{props.from && <SourceInfo source={props.from?.source} sourceId={props.from?.sourceId} sourcePart={props.from?.sourcePart}/>}</td>
            <td>{props.to && <SourceInfo source={props.to?.source} sourceId={props.to?.sourceId} sourcePart={props.to?.sourcePart}/>}</td>
        </tr>
    }
})

function useImageInfo(initId: number | null) {
    const toast = useToast()
    const httpClient = useHttpClient()

    const imageId = ref<number | null>(null)
    const metadata = ref<DetailIllust | null>(null)
    const relatedItems = ref<ImageRelatedItems | null>(null)
    const originData = ref<ImageOriginData | null>(null)

    const setImageId = (id: number | null) => {
        if(id !== null) {
            imageId.value = id
            httpClient.illust.image.get(id).then(res => {
                if(res.ok) {
                    metadata.value = res.data
                }else if(res.exception.code === "NOT_FOUND") {
                    toast.toast("无法使用此项目", "warning", "无法找到此图像。请确认图像存在、可用，且不要使用集合。")
                    imageId.value = null
                    metadata.value = null
                }
            })
            httpClient.illust.image.relatedItems.get(id, {}).then(res => {
                if(res.ok) {
                    relatedItems.value = res.data
                }else{
                    relatedItems.value = null
                }
            })
            httpClient.illust.image.originData.get(id).then(res => {
                if(res.ok) {
                    originData.value = res.data
                }else{
                    originData.value = null
                }
            })
        }else{
            imageId.value = null
            metadata.value = null
            relatedItems.value = null
            originData.value = null
        }
    }

    onMounted(() => setImageId(initId))

    return {imageId, metadata, relatedItems, originData, setImageId}
}

function useDropEvents(setId: (_: number) => void) {
    const toast = useToast()

    const { isDragover: _, ...dropEvents } = useDroppable("illusts", illusts => {
        if(illusts.length > 1) {
            toast.toast("选择项过多", "warning", "选择项过多。请仅选择1个项以拖放到此位置。")
            return
        }else if(illusts.length <= 0) {
            toast.toast("没有选择项", "warning", "选择项为空。")
            return
        }
        setId(illusts[0].id)
    })

    return dropEvents
}

function useOptions(fromId: Ref<number | null>, toId: Ref<number | null>, onSucceed?: (from: number, to: number, fromDeleted: boolean) => void) {
    const toast = useToast()
    const httpClient = useHttpClient()
    const options = useLocalStorageWithDefault<Form>("dialog/clone-image/options", {
        score: true, favorite: true, description: true, tagme: true, metaTags: true, orderTime: true, collection: true, albums: true, folders: true
    })

    const execute = async () => {
        if(fromId.value !== null && toId.value !== null) {
            const { merge, deleteFrom, ...props } = options.value
            const res = await httpClient.illust.cloneImageProps({
                props, merge, deleteFrom, from: fromId.value, to: toId.value
            })
            if(res.ok) {
                onSucceed?.(fromId.value, toId.value, deleteFrom ?? false)
            }else{
                toast.handleException(res.exception)
            }
        }
    }

    return {
        props: arrays.toMap(FORM_PROPS, key => splitRef(options, key)),
        options: arrays.toMap(FORM_OPTIONS, key => splitRef(options, key)),
        execute
    }
}

type Form = ImagePropsCloneForm["props"] & {merge?: boolean, deleteFrom?: boolean}

const FORM_PROPS: (keyof Form)[] = ["score", "favorite", "description", "tagme", "metaTags", "partitionTime", "orderTime", "collection", "albums", "folders", "source"]
const FORM_OPTIONS: (keyof Form)[] = ["merge", "deleteFrom"]

const FORM_TITLE: {[key in keyof Form]: string} = {
    score: "评分",
    favorite: "收藏",
    description: "描述",
    tagme: "Tagme",
    metaTags: "标签",
    partitionTime: "时间分区",
    orderTime: "排序时间",
    collection: "所属集合",
    albums: "所属画集",
    folders: "所属目录",
    source: "来源",
    merge: "合并复合关系而不是覆盖",
    deleteFrom: "克隆完成后，删除源图像"
}

export function useCloneImageService(): CloneImageContext {
    const { push } = useDialogServiceContext()
    return {
        clone(options: { from?: number; to?: number }, onSucceed?: (from: number, to: number, fromDeleted: boolean) => void) {
            push({
                type: "cloneImage",
                context: {from: options.from ?? null, to: options.to ?? null, onSucceed}
            })
        }
    }
}

