import { defineComponent } from "vue"
import { assetsUrl } from "@/functions/app"
import { useRelatedItemsEndpoint } from "../inject"
import style from "./style.module.scss"

export default defineComponent({
    setup() {
        const relatedItems = useRelatedItemsEndpoint()

        return () => <div class={style.relatedItemsPanel}>
            {relatedItems.data.value && <>
                {relatedItems.data.value.albums.length > 0 && <div class={style.albums}>
                    <b>所属画集</b>
                    {relatedItems.data.value.albums.map(album => <div class={style.album}><a>《{album.title}》</a></div>)}
                </div>}
                {relatedItems.data.value.collection !== null && <div class={style.collection}>
                    <b>所属集合</b>
                    <div class={style.image}>
                        <img src={assetsUrl(relatedItems.data.value.collection.thumbnailFile)} alt="related collection"/>
                        <span class={[style.numTag, "tag", "is-dark"]}><i class="fa fa-images"/>{relatedItems.data.value.collection.childrenCount}</span>
                    </div>
                </div>}
                {relatedItems.data.value.associate !== null && <div class={style.associate}>
                    <b>关联组</b>
                    <div class={style.images}>
                        {relatedItems.data.value.associate.items.map(item => <div class={style.image}>
                            <img src={assetsUrl(item.thumbnailFile)} alt="associate item"/>
                        </div>)}
                    </div>
                    <p class={style.more}><a>查看关联组的全部项目<i class="fa fa-angle-double-right ml-1"/></a></p>
                </div>}
                {relatedItems.data.value.albums.length === 0 && relatedItems.data.value.collection === null && relatedItems.data.value.associate === null && <div class={style.noAnyRelated}>
                    <i>没有相关的项目数据</i>
                </div>}
            </>}
        </div>
    }
})
