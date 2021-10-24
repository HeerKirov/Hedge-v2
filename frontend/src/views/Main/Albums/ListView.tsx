import { defineComponent, PropType } from "vue"
import { Album } from "@/functions/adapter-http/impl/album"
import { VirtualGrid } from "@/components/features/VirtualScrollView"
import { assetsUrl } from "@/functions/app"
import { arrays } from "@/utils/collections"
import { useAlbumContext } from "./inject"
import style from "./style.module.scss"

export default defineComponent({
    setup() {
        const { dataView, viewController: { columnNum } } = useAlbumContext()

        const click = (albumId: number) => {}
        const rightClick = (album: Album) => {}

        return () => <div class={[style.root, COLUMN_NUMBER_CLASS[columnNum.value]]}>
            <VirtualGrid {...dataView.data.value.metrics}
                         onUpdate={dataView.dataUpdate} columnCount={columnNum.value}
                         bufferSize={5} minUpdateDelta={1} padding={{top: 1, bottom: 1, left: 2, right: 2}} aspectRatio={3 / 5}>
                {dataView.data.value.result.map((item, i) => <AlbumItem key={item.id} data={item} index={dataView.data.value.metrics.offset + i} onRightClick={rightClick} onClick={click}/>)}
            </VirtualGrid>
        </div>
    }
})

const AlbumItem = defineComponent({
    props: {
        data: {type: Object as PropType<Album>, required: true},
        index: {type: Number, required: true}
    },
    emits: {
        rightClick: (_: Album) => true,
        click: (_: number, __: MouseEvent) => true,
    },
    setup(props, { emit }) {
        const click = (e: MouseEvent) => emit("click", props.data.id, e)
        const rightClick = () => emit("rightClick", props.data)

        return () => <div class={style.albumItem}>
            <div class={style.content} onContextmenu={rightClick}>
                <img src={assetsUrl(props.data.thumbnailFile)} alt={`album-${props.data.id}`} onClick={click}/>
                <div class={style.info}>
                    {props.data.imageCount > 0
                        ? <span class="float-right">(<b>{props.data.imageCount}</b>)</span>
                        : <span class="float-right has-text-grey">(空)</span>}
                    {props.data.title
                        ? <span class={["can-be-selected", style.title]} onClick={click}>{props.data.title}</span>
                        : <span class={style.title} onClick={click}><i class="fa fa-id-card mr-2"/><span class="can-be-selected">{props.data.id}</span></span>}
                </div>
            </div>
        </div>
    }
})

const COLUMN_MAX = 16
const COLUMN_NUMBER_CLASS = arrays.newArray(COLUMN_MAX + 1, i => style[`columnNum${i}`])
