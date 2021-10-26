import { defineComponent, markRaw } from "vue"
import TopBarLayout from "@/layouts/layouts/TopBarLayout"
import SideDrawer from "@/layouts/layouts/SideDrawer"
import IllustGrid from "@/layouts/data/IllustGrid"
import MetaTagEditor from "@/layouts/drawers/MetaTagEditor"
import { AlbumImage } from "@/functions/adapter-http/impl/album"
import { Illust } from "@/functions/adapter-http/impl/illust"
import { createSliceOfAll, createSliceOfList } from "@/functions/utils/endpoints/query-endpoint"
import { useFastObjectEndpoint } from "@/functions/utils/endpoints/object-fast-endpoint"
import { useNavigator } from "@/functions/feature/navigator"
import { useDynamicPopupMenu } from "@/functions/module/popup-menu"
import { useMessageBox } from "@/functions/module/message-box"
import { useCreatingCollectionDialog } from "@/layouts/dialogs/CreatingCollectionDialog"
import TopBarContent from "./TopBarContent"
import { useViewStack } from "../../view-stacks"
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
            dataView,
            endpoint,
            viewController: { columnNum, fitType },
            selector: { selected, lastSelected }
        } = usePreviewContext().images

        const updateSelected = (selectedValue: number[], lastSelectedValue: number | null) => {
            selected.value = selectedValue
            lastSelected.value = lastSelectedValue
        }

        const openMethod = useOpenMethod()

        const menu = useContextmenu(openMethod)

        return () => <IllustGrid data={markRaw(dataView.data.value)} onDataUpdate={dataView.dataUpdate}
                                 queryEndpoint={markRaw(endpoint.proxy)} fitType={fitType.value} columnNum={columnNum.value}
                                 selected={selected.value} lastSelected={lastSelected.value} onSelect={updateSelected}
                                 onRightClick={i => menu.popup(i as AlbumImage)} onDblClick={openMethod.clickToOpenDetail} onEnter={openMethod.enterToOpenDetail}/>
    }
})

function useContextmenu(openMethod: ReturnType<typeof useOpenMethod>) {
    const navigator = useNavigator()
    const { switchFavorite, deleteItem, createNewCollection } = useContextOperator()

    //TODO 完成album images右键菜单的功能; 将各个主要功能的实现更改至与selector相关的实现方式上, 注意处理点击项不属于选择列表时的情况
    const menu = useDynamicPopupMenu<AlbumImage>(image => [
        {type: "normal", label: "查看详情", click: image => openMethod.clickToOpenDetail(image.id)},
        {type: "separator"},
        {type: "normal", label: "在新窗口中打开", click: openInNewWindow},
        {type: "normal", label: "显示信息预览"},
        {type: "separator"},
        image.favorite
            ? {type: "normal", label: "取消标记为收藏", click: image => switchFavorite(image, false)}
            : {type: "normal", label: "标记为收藏", click: image => switchFavorite(image, true)},
        {type: "separator"},
        {type: "normal", label: "加入剪贴板"},
        {type: "separator"},
        {type: "normal", label: "创建图库项目集合", click: image => createNewCollection(image.id)},
        {type: "normal", label: "创建画集"},
        {type: "normal", label: "创建关联组"},
        {type: "normal", label: "添加到文件夹"},
        {type: "normal", label: "添加到\"X\""},
        {type: "normal", label: "添加到临时文件夹"},
        {type: "separator"},
        {type: "normal", label: "导出"},
        {type: "separator"},
        {type: "normal", label: "删除项目", click: deleteItem}
    ])

    const openInNewWindow = (illust: AlbumImage) => {
        navigator.newWindow.preferences.image(illust.id)
    }

    return menu
}

function useOpenMethod() {
    const { dataView, endpoint, selector: { selected }, scrollView } = usePreviewContext().images
    const viewStacks = useViewStack()

    const openAll = (illustId: number) => {
        const currentIndex = dataView.proxy.syncOperations.find(i => i.id === illustId)
        if(currentIndex !== undefined) {
            const data = createSliceOfAll<AlbumImage, Illust>(endpoint.instance.value, {
                to: data => ({...data, type: "IMAGE", childrenCount: null}),
                from: data => data
            })
            viewStacks.openImageView(data, currentIndex, (index: number) => {
                //回调：导航到目标index的位置
                scrollView.navigateTo(index)
            })
        }
    }

    const openList = (selected: number[], currentIndex: number) => {
        const indexList = selected
            .map(selectedId => dataView.proxy.syncOperations.find(i => i.id === selectedId))
            .filter(index => index !== undefined) as number[]
        const data = createSliceOfList<AlbumImage, Illust>(endpoint.instance.value, indexList, {
            to: data => ({...data, type: "IMAGE", childrenCount: null}),
            from: data => data
        })

        viewStacks.openImageView(data, currentIndex, async (index: number) => {
            //回调：给出了目标index，回查data中此index的项，并找到此项现在的位置，导航到此位置
            const illust = await data.get(index)
            if(illust !== undefined) {
                const index = dataView.proxy.syncOperations.find(i => i.id === illust.id)
                if(index !== undefined) scrollView.navigateTo(index)
            }
        })
    }

    const clickToOpenDetail = (illustId: number) => {
        if(selected.value.length > 1) {
            //选择项数量大于1时，只显示选择项列表
            const currentIndex = selected.value.indexOf(illustId)
            if(currentIndex <= -1) {
                //特殊情况：在选择项之外的项上右键选择了预览。此时仍按全局显示
                openAll(illustId)
            }else{
                openList(selected.value, currentIndex)
            }
        }else{
            //否则显示全局
            openAll(illustId)
        }
    }

    const enterToOpenDetail = (illustId: number) => {
        if(selected.value.length > 1) {
            //选择项数量大于1时，只显示选择项列表，且进入模式是enter进入，默认不指定选择项，从头开始浏览
            openList(selected.value, 0)
        }else{
            //否则显示全局
            openAll(illustId)
        }
    }

    return {clickToOpenDetail, enterToOpenDetail}
}

function useContextOperator() {
    const messageBox = useMessageBox()
    const creatingCollection = useCreatingCollectionDialog()

    const imageFastEndpoint = useFastObjectEndpoint({
        update: httpClient => httpClient.illust.image.update,
        delete: httpClient => httpClient.illust.image.delete
    })

    const { images: { dataView, endpoint, selector: { selected } }, data: { target, setTargetData } } = usePreviewContext()

    const switchFavorite = async (illust: AlbumImage, favorite: boolean) => {
        const ok = await imageFastEndpoint.setData(illust.id, { favorite })

        if(ok) {
            const index = dataView.proxy.syncOperations.find(i => i.id === illust.id)
            if(index !== undefined) {
                dataView.proxy.syncOperations.modify(index, {...illust, favorite})
            }
        }
    }

    const createNewCollection = async (illustId: number) => {
        if(selected.value.length > 0) {
            creatingCollection.createCollection(selected.value, () => endpoint.refresh())
        }else if(illustId !== undefined) {
            creatingCollection.createCollection([illustId], () => endpoint.refresh())
        }
    }

    const deleteItem = async (illust: AlbumImage) => {
        if(await messageBox.showYesNoMessage("warn", "确定要删除此项吗？", "此操作不可撤回。")) {
            const ok = await imageFastEndpoint.deleteData(illust.id)

            if(ok) {
                const index = dataView.proxy.syncOperations.find(i => i.id === illust.id)
                if(index !== undefined) {
                    dataView.proxy.syncOperations.remove(index)
                }
                //由于从画集删除项目产生的变化不大，因此做一些精细的操作来更新上层数据
                setTargetData({imageCount: target.value!.imageCount - 1})
                if(index === 0 && dataView.data.value.metrics.total! > 0) {
                    //移除首位的情况下，需要更新此album的封面
                    const first = dataView.proxy.syncOperations.retrieve(0)
                    if(first !== undefined) setTargetData({thumbnailFile: first.thumbnailFile})
                }
            }
        }
    }

    return {switchFavorite, createNewCollection, deleteItem}
}
