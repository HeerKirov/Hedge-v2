import { defineComponent, PropType } from "vue"
import { Album } from "@/functions/adapter-http/impl/album"
import { VirtualGrid } from "@/components/features/VirtualScrollView"
import { useFastObjectEndpoint } from "@/functions/utils/endpoints/object-fast-endpoint"
import { createProxySingleton } from "@/functions/utils/endpoints/query-endpoint"
import { useDynamicPopupMenu } from "@/functions/module/popup-menu"
import { useMessageBox } from "@/functions/module/message-box"
import { useRouterNavigator } from "@/functions/feature/router"
import { assetsUrl } from "@/functions/app"
import { arrays } from "@/utils/collections"
import { useViewStack } from "../../../layouts/view-stacks"
import { useAlbumContext } from "./inject"
import style from "./style.module.scss"

export default defineComponent({
    setup() {
        const { dataView, endpoint, viewController: { columnNum } } = useAlbumContext()
        const viewStacks = useViewStack()

        const openDetail = (album: Album) => {
            const index = dataView.proxy.syncOperations.find(i => i.id === album.id)
            if(index !== undefined) {
                const data = createProxySingleton(endpoint.instance.value, index)
                viewStacks.openAlbumView(data, () => endpoint.refresh())
            }
        }

        const menu = useContextmenu(openDetail)

        return () => <div class={[style.root, COLUMN_NUMBER_CLASS[columnNum.value]]}>
            <VirtualGrid {...dataView.data.value.metrics}
                         onUpdate={dataView.dataUpdate} columnCount={columnNum.value}
                         bufferSize={5} minUpdateDelta={1} padding={{top: 1, bottom: 4, left: 4, right: 4}} aspectRatio={3 / 5}>
                {dataView.data.value.result.map((item, i) => <AlbumItem key={item.id} data={item} index={dataView.data.value.metrics.offset + i} onRightClick={menu.popup} onClick={openDetail}/>)}
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
        click: (_: Album) => true,
    },
    setup(props, { emit }) {
        const click = () => emit("click", props.data)
        const rightClick = () => emit("rightClick", props.data)

        return () => <div class={style.albumItem}>
            <div class={style.content} onContextmenu={rightClick}>
                <img src={assetsUrl(props.data.thumbnailFile)} alt={`album-${props.data.id}`} onClick={click}/>
                {props.data.favorite && <i class={[style.favTag, "fa", "fa-heart", "has-text-danger", "is-size-medium"]}/>}
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

function useContextmenu(openDetail: (album: Album) => void) {
    const navigator = useRouterNavigator()
    const { switchFavorite, deleteItem } = useContextOperator()

    //TODO 完成album contextmenu (信息预览，导出)
    const menu = useDynamicPopupMenu<Album>(album => [
        {type: "normal", label: "查看详情", click: openDetail},
        {type: "separator"},
        {type: "normal", label: "在新窗口中打开", click: openInNewWindow},
        {type: "normal", label: "显示信息预览"},
        {type: "separator"},
        album.favorite
            ? {type: "normal", label: "取消标记为收藏", click: album => switchFavorite(album, false)}
            : {type: "normal", label: "标记为收藏", click: album => switchFavorite(album, true)},
        {type: "separator"},
        {type: "normal", label: "导出"},
        {type: "separator"},
        {type: "normal", label: "删除画集", click: deleteItem}
    ])

    const openInNewWindow = (album: Album) => navigator.newWindow({routeName: "Preview", params: {type: "album", albumId: album.id}})

    return menu
}

function useContextOperator() {
    const messageBox = useMessageBox()
    const { dataView } = useAlbumContext()
    const fastEndpoint = useFastObjectEndpoint({
        update: httpClient => httpClient.album.update,
        delete: httpClient => httpClient.album.delete
    })

    const switchFavorite = async (album: Album, favorite: boolean) => {
        const ok = await fastEndpoint.setData(album.id, { favorite })
        if(ok) {
            const index = dataView.proxy.syncOperations.find(i => i.id === album.id)
            if(index !== undefined) {
                dataView.proxy.syncOperations.modify(index, {...album, favorite})
            }
        }
    }

    const deleteItem = async (album: Album) => {
        if(await messageBox.showYesNoMessage("warn", "确定要删除此画集吗？画集内的图像不会被删除。", "此操作不可撤回。")) {
            const ok = await fastEndpoint.deleteData(album.id)

            if(ok) {
                const index = dataView.proxy.syncOperations.find(i => i.id === album.id)
                if(index !== undefined) {
                    dataView.proxy.syncOperations.remove(index)
                }
            }
        }
    }

    return {switchFavorite, deleteItem}
}
