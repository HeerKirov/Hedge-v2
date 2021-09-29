import { defineComponent } from "vue"
import { assetsUrl } from "@/functions/app"
import { useRelatedItemsEndpoint } from "../inject"
import style from "./style.module.scss"

export default defineComponent({
    setup() {
        const relatedItems = useRelatedItemsEndpoint()

        return () => <div class={style.relatedItemsPanel}>
            {relatedItems.data.value && <>
                {relatedItems.data.value.associate !== null ?
                    <div class={style.associate}>
                        <b>关联组</b>
                        <div class={style.images}>
                            {relatedItems.data.value.associate.items.map(item => <div class={style.image}>
                                <img src={assetsUrl(item.thumbnailFile)} alt="associate item"/>
                            </div>)}
                        </div>
                        <p class={style.more}><a>查看关联组的全部项目<i class="fa fa-angle-double-right ml-1"/></a></p>
                    </div>
                :
                    <div class={style.noAnyRelated}>
                        <i>没有相关的项目数据</i>
                    </div>
                }
            </>}
        </div>
    }
})
