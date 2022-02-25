import { defineComponent, markRaw } from "vue"
import TopBarLayout from "@/components/layouts/TopBarLayout"
import SideDrawer from "@/components/data/SideDrawer"
import SplitPane from "@/components/layouts/SplitPane"
import MetaTagEditor from "@/layouts/drawers/MetaTagEditor"
import {
    IllustGrid, GridContextOperatorResult,
    useGridContextOperator, IllustRowList, IllustPaneDetail
} from "@/layouts/data/DatasetView"
import { useAddToCollectionService } from "@/layouts/globals/GlobalDialog"
import { installExpandedInfoStorage } from "@/layouts/data/TagTree"
import { DetailIllust, Illust } from "@/functions/adapter-http/impl/illust"
import { createProxySingleton, createSliceOfAll, createSliceOfList } from "@/functions/endpoints/query-endpoint"
import { useDroppable } from "@/services/global/drag"
import { useDynamicPopupMenu } from "@/services/module/popup-menu"
import { useMessageBox } from "@/services/module/message-box"
import { useHttpClient } from "@/services/app"
import TopBarContent from "./TopBarContent"
import { usePreviewContext, useMetadataEndpoint } from "./inject"

export default defineComponent({
    setup() {
        const { ui: { drawerTab }, images: { dataView, endpoint, pane } } = usePreviewContext()

        installExpandedInfoStorage()

        const closeDrawerTab = () => drawerTab.value = undefined

        const closePane = () => pane.visible.value = false
        const onRefreshEndpoint = () => endpoint.refresh
        const onAfterUpdate = (id: number, data: DetailIllust) => {
            const index = dataView.proxy.syncOperations.find(i => i.id === id)
            if(index != undefined) dataView.proxy.syncOperations.modify(index, data)
        }

        const topBarLayoutSlots = {
            topBar() { return <TopBarContent/> },
            default() { return <SplitPane showPane={pane.visible.value} v-slots={{
                default: () => <ListView/>,
                pane: () => <IllustPaneDetail state={pane.state.value} onClose={closePane} onAfterUpdate={onAfterUpdate} onRefreshEndpoint={onRefreshEndpoint}/>
            }}/> }
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
        const { ui: { drawerTab }, data: { id } } = usePreviewContext()
        const { data, setData } = useMetadataEndpoint()

        const closeDrawerTab = () => drawerTab.value = undefined

        return () => <MetaTagEditor identity={id.value !== null ? {id: id.value!, type: "COLLECTION"} : null}
                                    tags={data.value?.tags ?? []}
                                    topics={data.value?.topics ?? []}
                                    authors={data.value?.authors ?? []}
                                    tagme={data.value?.tagme ?? []}
                                    setData={setData} onClose={closeDrawerTab}/>
    }
})

const ListView = defineComponent({
    setup() {
        const {
            images: {
                dataView, endpoint, scrollView,
                viewController: { fitType, columnNum, viewMode },
                selector: { selected, lastSelected }
            },
            data: { toastRefresh }
        } = usePreviewContext()

        const updateSelected = (selectedValue: number[], lastSelectedValue: number | null) => {
            selected.value = selectedValue
            lastSelected.value = lastSelectedValue
        }

        const operator = useGridContextOperator<Illust>({
            dataView, endpoint, scrollView, selected,
            createSliceOfAll: createSliceOfAll,
            createSliceOfList: createSliceOfList,
            createSliceOfSingleton: createProxySingleton,
            splitToGenerateNewCollection: {
                refreshAfterCreated: true,
                afterCreated: toastRefresh //拆分动作幅度太大，对于上层只能重新刷新列表
            },
            createAlbum: true,
            addToFolder: true,
            cloneImage: true,
            afterDeleted: toastRefresh, //FUTURE 删除图像是能优化的，对上层的影响仅限于target自身
                                        //      调整context operator的回调，给出变动列表；调整preview context，增加一个重新请求target自己的方法。
                                        //      在此处回调时，只需要重新请求target自己并set，而不需要通知上层完全刷新。其他位置也要做同步修改。
        })

        const collectionOperator = useCollectionOperator(operator)

        const menu = useContextmenu(operator, collectionOperator)

        const dropEvents = useDropEvents()

        return () => viewMode.value === "grid"
            ? <IllustGrid data={markRaw(dataView.data.value)} onDataUpdate={dataView.dataUpdate} draggable={true} {...dropEvents}
                          queryEndpoint={markRaw(endpoint.proxy)} fitType={fitType.value} columnNum={columnNum.value}
                          selected={selected.value} lastSelected={lastSelected.value} onSelect={updateSelected}
                          onRightClick={i => menu.popup(i as Illust)} onDblClick={operator.clickToOpenDetail} onEnter={operator.enterToOpenDetail}/>
            : <IllustRowList data={markRaw(dataView.data.value)} onDataUpdate={dataView.dataUpdate} draggable={true} {...dropEvents}
                             queryEndpoint={markRaw(endpoint.proxy)} selected={selected.value} lastSelected={lastSelected.value} onSelect={updateSelected}
                             onRightClick={i => menu.popup(i as Illust)} onDblClick={operator.clickToOpenDetail} onEnter={operator.enterToOpenDetail}/>
    }
})

function useContextmenu(operator: GridContextOperatorResult<Illust>, collectionOperator: ReturnType<typeof useCollectionOperator>) {
    const { images: { pane } } = usePreviewContext()
    //TODO 完成collection右键菜单的功能 (剪贴板，关联组，导出)
    return useDynamicPopupMenu<Illust>(illust => [
        {type: "normal", label: "查看详情", click: illust => operator.clickToOpenDetail(illust.id)},
        {type: "normal", label: "在新窗口中打开", click: operator.openInNewWindow},
        {type: "separator"},
        {type: "checkbox", label: "显示信息预览", checked: pane.visible.value, click: () => pane.visible.value = !pane.visible.value},
        {type: "separator"},
        illust.favorite
            ? {type: "normal", label: "取消标记为收藏", click: illust => operator.modifyFavorite(illust, false)}
            : {type: "normal", label: "标记为收藏", click: illust => operator.modifyFavorite(illust, true)},
        {type: "separator"},
        {type: "normal", label: "加入剪贴板"},
        {type: "separator"},
        {type: "normal", label: "拆分至新集合", click: operator.splitToGenerateNewCollection},
        {type: "normal", label: "创建画集", click: operator.createAlbum},
        {type: "normal", label: "创建关联组"},
        {type: "normal", label: "添加到目录…", click: operator.addToFolder},
        {type: "normal", label: "克隆图像属性…", click: operator.cloneImage},
        {type: "separator"},
        {type: "normal", label: "导出"},
        {type: "separator"},
        {type: "normal", label: "删除项目", click: operator.deleteItem},
        {type: "normal", label: "从集合移除此项目", click: collectionOperator.removeItemFromCollection}
    ])
}

function useCollectionOperator(operator: GridContextOperatorResult<Illust>) {
    const messageBox = useMessageBox()
    const httpClient = useHttpClient()
    const { images: { dataView }, data: { toastRefresh } } = usePreviewContext()

    const removeItemFromCollection = async (illust: Illust) => {
        const images = operator.getEffectedItems(illust)
        if(await messageBox.showYesNoMessage("warn", `确定要从集合移除${images.length > 1 ? "这些" : "此"}项吗？`)) {
            const ok = await Promise.all(images.map(illustId => httpClient.illust.image.relatedItems.update(illustId, {collectionId: null})))
            for (let i = 0; i < ok.length; i++) {
                if(ok[i]) {
                    const index = dataView.proxy.syncOperations.find(ill => ill.id === images[i])
                    if(index !== undefined) {
                        dataView.proxy.syncOperations.remove(index)
                    }
                }
            }
            if(ok.some(b => b)) {
                //从集合移除图像对上层影响不可控，因此也只能刷新列表
                toastRefresh()
            }
        }
    }

    return {removeItemFromCollection}
}

function useDropEvents() {
    const { data: { id }, images: { endpoint } } = usePreviewContext()
    const addToCollectionService = useAddToCollectionService()

    const { isDragover: _, ...dropEvents } = useDroppable("illusts", (illusts) => {
        if(id.value !== null) {
            addToCollectionService.addToCollection(illusts.map(i => i.id), id.value, () => endpoint.refresh())
        }
    })

    return dropEvents
}
