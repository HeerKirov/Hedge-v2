import { defineComponent } from "vue"
import GridImage from "@/components/elements/GridImage"
import ThumbnailImage from "@/components/elements/ThumbnailImage"
import { SimpleAlbum } from "@/functions/adapter-http/impl/album"
import { useViewStack } from "../../index"
import { useRelatedItemsEndpoint } from "../inject"
import style from "./style.module.scss"

export default defineComponent({
    setup() {
        const relatedItems = useRelatedItemsEndpoint()

        const viewStacks = useViewStack()

        const onRelatedAlbum = (album: SimpleAlbum) => () => {
            viewStacks.openAlbumView(album.id)
        }

        const openRelatedCollection = () => {
            const id = relatedItems.data.value?.collection?.id
            if(id !== undefined) {
                viewStacks.openCollectionView(id)
            }
        }

        return () => <div class={style.relatedItemsPanel}>
            {relatedItems.data.value && [
                relatedItems.data.value.albums.length > 0 && <div class={style.albums}>
                    <b>所属画集</b>
                    {relatedItems.data.value.albums.map(album => <div key={album.id} class={style.album}><a onClick={onRelatedAlbum(album)}>《{album.title}》</a></div>)}
                </div>,
                relatedItems.data.value.collection !== null && <div class={style.collection}>
                    <b>所属集合</b><i class="fa fa-id-card mx-2"/><b class="can-be-selected">{relatedItems.data.value.collection.id}</b>
                    <ThumbnailImage class="mt-1 is-cursor-pointer" onClick={openRelatedCollection} value={relatedItems.data.value.collection.thumbnailFile} numTagValue={relatedItems.data.value.collection.childrenCount}/>
                </div>,
                relatedItems.data.value.associate !== null && <div class={style.associate}>
                    <b>关联组</b>
                    <GridImage class={style.images} value={relatedItems.data.value.associate.items.map(i => i.thumbnailFile)} columnNum={3} radius="small" boxShadow={true}/>
                    <p class={style.more}><a>查看关联组的全部项目<i class="fa fa-angle-double-right ml-1"/></a></p>
                </div>,
                relatedItems.data.value.albums.length === 0 &&
                relatedItems.data.value.collection === null &&
                relatedItems.data.value.associate === null && <div class={style.noAnyRelated}>
                    <i>没有相关的项目数据</i>
                </div>
            ]}
        </div>
    }
})
