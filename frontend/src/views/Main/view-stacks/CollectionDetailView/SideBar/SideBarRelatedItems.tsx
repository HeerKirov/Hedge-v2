import { defineComponent } from "vue"
import GridImage from "@/components/elements/GridImage"
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
                        <GridImage class={style.images} value={relatedItems.data.value.associate.items.map(i => i.thumbnailFile)} columnNum={3} radius="small" boxShadow={true}/>
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
