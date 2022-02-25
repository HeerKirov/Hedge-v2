import { computed, defineComponent, onMounted, PropType, ref, watch } from "vue"
import ThumbnailImage from "@/components/elements/ThumbnailImage"
import OneImage from "@/components/elements/OneImage"
import WrappedText from "@/components/elements/WrappedText"
import { SimpleMetaTagElement } from "@/layouts/elements"
import { SourceInfo } from "@/layouts/displays/SourceDisplays"
import { PartitionTimeDisplay, ScoreDisplay, TagmeInfo, TimeDisplay } from "@/layouts/displays/PublicDisplays"
import { SimpleAuthor, SimpleTag, SimpleTopic } from "@/functions/adapter-http/impl/all"
import { DetailIllust, IllustParent, ImageOriginData, ImageRelatedItems } from "@/functions/adapter-http/impl/illust"
import { SimpleAlbum } from "@/functions/adapter-http/impl/album"
import { SimpleFolder } from "@/functions/adapter-http/impl/folder"
import { useToast } from "@/services/module/toast"
import { useHttpClient } from "@/services/app"
import { useDroppable } from "@/services/global/drag"
import { installSettingSite } from "@/services/api/setting"
import { arrays } from "@/utils/collections"
import { numbers } from "@/utils/primitives"
import style from "./ImageCompareTable.module.scss"

export const ImageCompareTable = defineComponent({
    props: {
        columnNum: {type: Number, default: 2},
        titles: {type: Array as PropType<string[]>, default: []},
        ids: {type: Array as PropType<(number | null)[]>, default: []},
        droppable: Boolean
    },
    emits: {
        update: (index: number, id: number) => true
    },
    setup(props, { emit }) {
        const context = arrays.newArray(props.columnNum, index => {
            const imageInfo = useImageInfo(props.ids[index])
            const dropEvents = useDropEvents(id => emit("update", index, id))
            return {imageInfo, dropEvents}
        })

        watch(() => props.ids, ids => ids.forEach((id, index) => context[index].imageInfo.setImageId(id)))

        const widthCSS = `width: ${numbers.round2decimal((100 - 15) / props.columnNum)}%`

        return () => <table class="table is-fullwidth mx-1">
            <thead>
                <tr>
                    <th class="is-width-15"/>
                    {arrays.newArray(props.columnNum, index => <th style={widthCSS}>{props.titles[index]}</th>)}
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td/>
                    {arrays.newArray(props.columnNum, index => <td><ThumbnailImage value={context[index].imageInfo.metadata.value?.thumbnailFile} {...context[index].dropEvents}/></td>)}
                </tr>
                <MetadataInfo values={context.map(i => i.imageInfo.metadata.value)}/>
                <RelatedItemsInfo values={context.map(i => i.imageInfo.relatedItems.value)}/>
                <OriginDataInfo values={context.map(i => i.imageInfo.originData.value)}/>
            </tbody>
        </table>
    }
})

const MetadataInfo = defineComponent({
    props: {
        values: {type: Array as PropType<(DetailIllust | null)[]>, required: true}
    },
    setup(props) {
        return () => <>
            <tr class="has-text-centered">
                <td>ID</td>
                {props.values.map(p => <td>{p && <><i class="fa fa-id-card mr-2"/><b class="can-be-selected">{p.id}</b></>}</td>)}
            </tr>
            {props.values.some(i => i?.score || i?.favorite) && <tr class="has-text-centered">
                <td>评分/收藏</td>
                {props.values.map(i => <td>
                    {i && <ScoreDisplay class="is-inline-block" value={i.score ?? null}/>}
                    {i?.favorite && <i class="fa fa-heart has-text-danger ml-2"/>}
                </td>)}
            </tr>}
            {props.values.some(i => i?.description) && <tr class="has-text-centered">
                <td>描述</td>
                {props.values.map(i => <td>{i && <WrappedText value={i.description}/>}</td>)}
            </tr>}
            {props.values.some(i => i?.tagme) && <tr class="has-text-centered">
                <td>Tagme</td>
                {props.values.map(i => <td>{i && <TagmeInfo value={i.tagme}/>}</td>)}
            </tr>}
            {props.values.some(i => i?.tags.length || i?.topics.length || i?.authors.length) && <tr class="has-text-centered">
                <td>标签</td>
                {props.values.map(i => <td>{i && <MetaTagList tags={i.tags} topics={i.topics} authors={i.authors}/>}</td>)}
            </tr>}
            {props.values.some(i => !!i) && <tr class="has-text-centered">
                <td>时间</td>
                {props.values.map(i => <td>
                    {i && <PartitionTimeDisplay partitionTime={i.partitionTime}/>}
                    <TimeDisplay createTime={i?.createTime} updateTime={i?.updateTime} orderTime={i?.orderTime}/>
                </td>)}
            </tr>}
        </>
    }
})

const RelatedItemsInfo = defineComponent({
    props: {
        values: {type: Array as PropType<(ImageRelatedItems | null)[]>, required: true}
    },
    setup(props) {
        return () => <>
            {props.values.some(i => i?.collection) && <tr class="has-text-centered">
                <td>所属集合</td>
                {props.values.map(i => <td>{i && <CollectionInfo parent={i.collection}/>}</td>)}
            </tr>}
            {props.values.some(i => i?.albums) && <tr class="has-text-centered">
                <td>所属画集</td>
                {props.values.map(i => <td>{i && <AlbumsInfo albums={i.albums}/>}</td>)}
            </tr>}
            {props.values.some(i => i?.folders) && <tr class="has-text-centered">
                <td>所属目录</td>
                {props.values.map(i => <td>{i && <FoldersInfo folders={i.folders}/>}</td>)}
            </tr>}
        </>
    }
})

const OriginDataInfo = defineComponent({
    props: {
        values: {type: Array as PropType<(ImageOriginData | null)[]>, required: true}
    },
    setup(props) {
        installSettingSite()

        return () => props.values.some(i => i?.source) && <tr class="has-text-centered">
            <td>来源</td>
            {props.values.map(i => <td>{i && <SourceInfo source={i.source} sourceId={i.sourceId} sourcePart={i.sourcePart}/>}</td>)}
        </tr>
    }
})

const MetaTagList = defineComponent({
    props: {
        tags: Array as PropType<SimpleTag[]>,
        topics: Array as PropType<SimpleTopic[]>,
        authors: Array as PropType<SimpleAuthor[]>,
    },
    setup(props) {
        const MAX = 5
        const tags = computed(() => !expand.value && (props.tags?.length ?? 0) > MAX ? props.tags!.slice(0, MAX) : (props.tags ?? []))
        const topics = computed(() => !expand.value && (props.topics?.length ?? 0) > MAX ? props.topics!.slice(0, MAX) : (props.topics ?? []))
        const authors = computed(() => !expand.value && (props.authors?.length ?? 0) > MAX ? props.authors!.slice(0, MAX) : (props.authors ?? []))
        const shouldCollapse = computed(() => (props.tags?.length ?? 0) > MAX || (props.topics?.length ?? 0) > MAX || (props.authors?.length ?? 0) > MAX)

        const expand = ref(false)

        return () => !props.tags?.length && !props.authors?.length && !props.topics?.length ? <i class="has-text-grey">没有元数据标签</i> : <>
            {authors.value.map(author => <SimpleMetaTagElement class="mt-half mr-half" key={`author-${author.id}`} type="author" value={author}/>)}
            {topics.value.map(topic => <SimpleMetaTagElement class="mt-half mr-half" key={`topic-${topic.id}`} type="topic" value={topic}/>)}
            {tags.value.map(tag => <SimpleMetaTagElement class="mt-half mr-half" key={`tag-${tag.id}`} type="tag" value={tag}/>)}
            {shouldCollapse.value && !expand.value && <div><a onClick={() => expand.value = true}>查看全部<i class="fa fa-angle-double-right ml-2"/></a></div>}
        </>
    }
})

function CollectionInfo(props: {parent?: IllustParent | null}) {
    return props.parent ? <div class={style.collectionInfo}>
        <span class={style.cover}><OneImage value={props.parent.thumbnailFile} radius="small" boxShadow={true}/></span>
        <i class="fa fa-id-card mx-2"/><b class="can-be-selected">{props.parent.id}</b>
    </div> : <i class="has-text-grey">无所属集合</i>
}

function AlbumsInfo(props: {albums?: SimpleAlbum[] | null}) {
    return props?.albums?.length ? <>{props.albums.map(album => <AlbumInfo album={album}/>)}</> : <i class="has-text-grey">无所属画集</i>
}

function AlbumInfo(props: {album: SimpleAlbum}) {
    return <div class={style.albumInfo}>
        {props.album.title}
    </div>
}

function FoldersInfo(props: {folders?: SimpleFolder[] | null}) {
    return props.folders?.length ? <table class="table is-fullwidth mx-1">
        <tbody>
        {props.folders.map(folder => <FolderInfo folder={folder}/>)}
        </tbody>
    </table> : <i class="has-text-grey">无所属目录</i>
}

function FolderInfo(props: {folder: SimpleFolder}) {
    return <tr>
        <td>{props.folder.address.join(" / ")}</td>
    </tr>
}

function useImageInfo(initId: number | null) {
    const toast = useToast()
    const httpClient = useHttpClient()

    const imageId = ref<number | null>(null)
    const metadata = ref<DetailIllust | null>(null)
    const relatedItems = ref<ImageRelatedItems | null>(null)
    const originData = ref<ImageOriginData | null>(null)

    const setImageId = (id: number | null) => {
        if(imageId.value !== id) {
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
