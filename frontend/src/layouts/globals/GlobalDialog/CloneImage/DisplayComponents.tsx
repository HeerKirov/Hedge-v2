import { computed, defineComponent, PropType, ref } from "vue"
import OneImage from "@/components/elements/OneImage"
import { SimpleAuthor, SimpleTag, SimpleTopic } from "@/functions/adapter-http/impl/all"
import { IllustParent } from "@/functions/adapter-http/impl/illust"
import { SimpleAlbum } from "@/functions/adapter-http/impl/album"
import { SimpleFolder } from "@/functions/adapter-http/impl/folder"
import { SimpleMetaTagElement } from "@/layouts/elements"
import style from "./style.module.scss"

export const MetaTagList = defineComponent({
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


export function CollectionInfo(props: {parent?: IllustParent | null}) {
    return props.parent ? <div class={style.collectionInfo}>
        <span class={style.cover}><OneImage value={props.parent.thumbnailFile} radius="small" boxShadow={true}/></span>
        <i class="fa fa-id-card mx-2"/><b class="can-be-selected">{props.parent.id}</b>
    </div> : <i class="has-text-grey">无所属集合</i>
}

export function AlbumsInfo(props: {albums?: SimpleAlbum[] | null}) {
    return props?.albums?.length ? <>{props.albums.map(album => <AlbumInfo album={album}/>)}</> : <i class="has-text-grey">无所属画集</i>
}

function AlbumInfo(props: {album: SimpleAlbum}) {
    return <div class={style.albumInfo}>
        {props.album.title}
    </div>
}

export function FoldersInfo(props: {folders?: SimpleFolder[] | null}) {
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
