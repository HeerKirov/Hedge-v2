import { defineComponent, markRaw } from "vue"
import TopBarLayout from "@/layouts/layouts/TopBarLayout"
import SideDrawer from "@/layouts/layouts/SideDrawer"
import MetaTagEditor from "@/layouts/drawers/MetaTagEditor"
import IllustGrid, { GridContextOperatorResult, useGridContextOperator } from "@/layouts/data/IllustGrid"
import { useAddToCollectionService } from "@/layouts/dialogs"
import { installExpandedInfoStorage } from "@/layouts/data/TagTree"
import { Illust } from "@/functions/adapter-http/impl/illust"
import { createProxySingleton, createSliceOfAll, createSliceOfList } from "@/functions/utils/endpoints/query-endpoint"
import { useDroppable } from "@/functions/feature/drag"
import { useDynamicPopupMenu } from "@/functions/module/popup-menu"
import { useMessageBox } from "@/functions/module/message-box"
import { useHttpClient } from "@/functions/app"
import TopBarContent from "./TopBarContent"
import { usePreviewContext, useMetadataEndpoint } from "./inject"

export default defineComponent({
    setup() {
        const { ui: { drawerTab } } = usePreviewContext()

        installExpandedInfoStorage()

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
                viewController: { fitType, columnNum },
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
            afterDeleted: toastRefresh, //FUTURE 删除图像是能优化的，对上层的影响仅限于target自身
                                        //      调整context operator的回调，给出变动列表；调整preview context，增加一个重新请求target自己的方法。
                                        //      在此处回调时，只需要重新请求target自己并set，而不需要通知上层完全刷新。其他位置也要做同步修改。
        })

        const collectionOperator = useCollectionOperator()

        const menu = useContextmenu(operator, collectionOperator)

        const dropEvents = useDropEvents()

        return () => <IllustGrid data={markRaw(dataView.data.value)} onDataUpdate={dataView.dataUpdate} draggable={true} {...dropEvents}
                                 queryEndpoint={markRaw(endpoint.proxy)} fitType={fitType.value} columnNum={columnNum.value}
                                 selected={selected.value} lastSelected={lastSelected.value} onSelect={updateSelected}
                                 onRightClick={i => menu.popup(i as Illust)} onDblClick={operator.clickToOpenDetail} onEnter={operator.enterToOpenDetail}/>
    }
})

function useContextmenu(operator: GridContextOperatorResult<Illust>, collectionOperator: ReturnType<typeof useCollectionOperator>) {
    //TODO 完成collection右键菜单的功能 (信息预览，剪贴板，关联组，目录，导出)
    return useDynamicPopupMenu<Illust>(illust => [
        {type: "normal", label: "查看详情", click: illust => operator.clickToOpenDetail(illust.id)},
        {type: "separator"},
        {type: "normal", label: "在新窗口中打开", click: operator.openInNewWindow},
        {type: "normal", label: "显示信息预览"},
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
        {type: "normal", label: "添加到目录"},
        {type: "normal", label: "添加到\"X\""},
        {type: "normal", label: "添加到临时目录"},
        {type: "separator"},
        {type: "normal", label: "导出"},
        {type: "separator"},
        {type: "normal", label: "删除项目", click: operator.deleteItem},
        {type: "normal", label: "从集合移除此项目", click: collectionOperator.removeItemFromCollection}
    ])
}

function useCollectionOperator() {
    const messageBox = useMessageBox()
    const httpClient = useHttpClient()
    const { images: { dataView, selector: { selected } }, data: { toastRefresh } } = usePreviewContext()

    const removeItemFromCollection = async (illust: Illust) => {
        const images = selected.value.includes(illust.id) ? selected.value : [...selected.value, illust.id]
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
