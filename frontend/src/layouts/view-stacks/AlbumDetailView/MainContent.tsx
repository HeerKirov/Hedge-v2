import { defineComponent, markRaw } from "vue"
import TopBarLayout from "@/layouts/layouts/TopBarLayout"
import SideDrawer from "@/layouts/layouts/SideDrawer"
import { IllustGrid, GridContextOperatorResult, useGridContextOperator, IllustRowList } from "@/layouts/data/Dataset"
import MetaTagEditor from "@/layouts/drawers/MetaTagEditor"
import { TypeDefinition } from "@/functions/feature/drag/definition"
import { AlbumImage } from "@/functions/adapter-http/impl/album"
import { createSliceOfAll, createSliceOfList } from "@/functions/utils/endpoints/query-endpoint"
import { useAddToAlbumService } from "@/layouts/dialogs"
import { useDynamicPopupMenu } from "@/functions/module/popup-menu"
import { useMessageBox } from "@/functions/module/message-box"
import { useHttpClient } from "@/functions/app"
import { useToast } from "@/functions/module/toast"
import TopBarContent from "./TopBarContent"
import { usePreviewContext } from "./inject"

export default defineComponent({
    setup() {
        const { ui: { drawerTab } } = usePreviewContext()

        const closeDrawerTab = () => drawerTab.value = undefined

        const topBarLayoutSlots = {
            topBar() { return <TopBarContent/> },
            default() { return <ListView/> }
        }
        const sideDrawerSlots = {
            "metaTag"() { return <MetaTagEditorPanel/> }
        }
        return () => <>
            <TopBarLayout v-slots={topBarLayoutSlots}/>
            <SideDrawer tab={drawerTab.value} onClose={closeDrawerTab} v-slots={sideDrawerSlots}/>
        </>
    }
})

const MetaTagEditorPanel = defineComponent({
    setup() {
        const { ui: { drawerTab }, data: { id }, detailInfo } = usePreviewContext()

        const closeDrawerTab = () => drawerTab.value = undefined

        return () => <MetaTagEditor identity={id.value !== null ? {id: id.value!, type: "ALBUM"} : null}
                                    tags={detailInfo.data.value?.tags ?? []}
                                    topics={detailInfo.data.value?.topics ?? []}
                                    authors={detailInfo.data.value?.authors ?? []}
                                    tagme={[]} setData={detailInfo.setData} onClose={closeDrawerTab}/>
    }
})

const ListView = defineComponent({
    setup() {
        const {
            images: {
                dataView, endpoint, scrollView,
                viewController: { columnNum, fitType, editable, viewMode },
                selector: { selected, lastSelected }
            },
            data: { toastRefresh }
        } = usePreviewContext()

        const updateSelected = (selectedValue: number[], lastSelectedValue: number | null) => {
            selected.value = selectedValue
            lastSelected.value = lastSelectedValue
        }

        const operator = useGridContextOperator<AlbumImage>({
            dataView, endpoint, scrollView, selected,
            createSliceOfAll: instance => createSliceOfAll(instance, {
                to: data => ({...data, type: "IMAGE", childrenCount: null}),
                from: data => data
            }),
            createSliceOfList: (instance, indexList) => createSliceOfList(instance, indexList, {
                to: data => ({...data, type: "IMAGE", childrenCount: null}),
                from: data => data
            }),
            createCollection: {forceDialog: true},
            addToFolder: true,
            cloneImage: true,
            afterDeleted: toastRefresh, //FUTURE 删除图像是能优化的，对上层的影响仅限于target自身
        })

        const albumOperator = useAlbumOperator(operator)

        const menu = useContextmenu(operator, albumOperator)

        return () => viewMode.value === "grid"
            ? <IllustGrid data={markRaw(dataView.data.value)} onDataUpdate={dataView.dataUpdate} draggable={true} droppable={editable.value}
                          queryEndpoint={markRaw(endpoint.proxy)} fitType={fitType.value} columnNum={columnNum.value}
                          selected={selected.value} lastSelected={lastSelected.value} onSelect={updateSelected}
                          onRightClick={i => menu.popup(i as AlbumImage)} onDblClick={operator.clickToOpenDetail} onEnter={operator.enterToOpenDetail} onDataDrop={albumOperator.dropEvent}/>
            : <IllustRowList data={markRaw(dataView.data.value)} onDataUpdate={dataView.dataUpdate} draggable={true} droppable={editable.value}
                             queryEndpoint={markRaw(endpoint.proxy)} selected={selected.value} lastSelected={lastSelected.value} onSelect={updateSelected}
                             onRightClick={i => menu.popup(i as AlbumImage)} onDblClick={operator.clickToOpenDetail} onEnter={operator.enterToOpenDetail} onDataDrop={albumOperator.dropEvent}/>
    }
})

function useContextmenu(operator: GridContextOperatorResult<AlbumImage>, albumOperator: ReturnType<typeof useAlbumOperator>) {
    const { data: { id } } = usePreviewContext()
    //TODO 完成album images右键菜单的功能 (信息预览，剪贴板，关联组，导出)
    return useDynamicPopupMenu<AlbumImage>(image => [
        {type: "normal", label: "查看详情", click: image => operator.clickToOpenDetail(image.id)},
        {type: "separator"},
        {type: "normal", label: "在新窗口中打开", click: operator.openInNewWindow},
        {type: "normal", label: "显示信息预览"},
        {type: "separator"},
        image.favorite
            ? {type: "normal", label: "取消标记为收藏", click: image => operator.modifyFavorite(image, false)}
            : {type: "normal", label: "标记为收藏", click: image => operator.modifyFavorite(image, true)},
        {type: "separator"},
        {type: "normal", label: "加入剪贴板"},
        {type: "separator"},
        {type: "normal", label: "创建图像集合…", click: operator.createCollection},
        {type: "normal", label: "创建关联组"},
        {type: "normal", label: "添加到目录…", click: operator.addToFolder},
        {type: "normal", label: "克隆图像属性…", click: operator.cloneImage},
        {type: "separator"},
        {type: "normal", label: "导出"},
        {type: "separator"},
        {type: "normal", label: "删除项目", click: operator.deleteItem},
        {type: "normal", label: "从画集移除此项目", click: i => albumOperator.removeItemFromAlbum(i, id.value!)}
    ])
}

function useAlbumOperator(operator: GridContextOperatorResult<AlbumImage>) {
    const toast = useToast()
    const messageBox = useMessageBox()
    const httpClient = useHttpClient()
    const addToAlbum = useAddToAlbumService()
    const { images: { dataView, endpoint }, data: { id, toastRefresh } } = usePreviewContext()

    const removeItemFromAlbum = async (illust: AlbumImage, albumId: number) => {
        const images = operator.getEffectedItems(illust)
        if(await messageBox.showYesNoMessage("warn", `确定要从画集移除${images.length > 1 ? "这些" : "此"}项吗？`)) {
            const ok = await httpClient.album.images.partialUpdate(albumId, {action: "DELETE", images})
            if(ok) {
                if(images.length <= 1) {
                    const index = dataView.proxy.syncOperations.find(i => i.id === illust.id)
                    if(index !== undefined) {
                        dataView.proxy.syncOperations.remove(index)
                        //FUTURE 移除图像也是能优化的，对上层的影响仅限于target自身
                        toastRefresh()
                    }
                }else{
                    //删除数量大于2时，直接刷新
                    endpoint.refresh()
                    toastRefresh()
                }
            }
        }
    }

    const dropEvent = async (insertIndex: number | null, illusts: TypeDefinition["illusts"], mode: "ADD" | "MOVE") => {
        if(id.value !== null) {
            if(mode === "ADD") {
                const images = await addToAlbum.existsCheck(illusts.map(i => i.id), id.value)
                if(images !== undefined && images.length > 0) {
                    const res = await httpClient.album.images.partialUpdate(id.value, {action: "ADD", images, ordinal: insertIndex})
                    if(res.ok) {
                        //刷新列表数据
                        endpoint.refresh()
                    }else{
                        toast.handleException(res.exception)
                    }
                }
            }else if(illusts.length > 0) {
                //移动操作直接调用API即可
                const res = await httpClient.album.images.partialUpdate(id.value, {action: "MOVE", images: illusts.map(i => i.id), ordinal: insertIndex})
                if(res.ok) {
                    //刷新列表数据
                    endpoint.refresh()
                }else{
                    toast.handleException(res.exception)
                }
            }

        }
    }

    return {removeItemFromAlbum, dropEvent}
}
