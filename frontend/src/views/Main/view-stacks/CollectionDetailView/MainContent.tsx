import { defineComponent, markRaw } from "vue"
import TopBarLayout from "@/layouts/layouts/TopBarLayout"
import SideDrawer from "@/layouts/layouts/SideDrawer"
import IllustGrid from "@/layouts/data/IllustGrid"
import MetaTagEditor from "@/layouts/drawers/MetaTagEditor"
import TopBarContent from "./TopBarContent"
import { Illust } from "@/functions/adapter-http/impl/illust"
import { createSliceOfAll, createSliceOfList } from "@/functions/utils/endpoints/query-endpoint"
import { useFastObjectEndpoint } from "@/functions/utils/endpoints/object-fast-endpoint"
import { useNavigator } from "@/functions/feature/navigator"
import { useDynamicPopupMenu } from "@/functions/module/popup-menu"
import { useMessageBox } from "@/functions/module/message-box"
import { useToast } from "@/functions/module/toast"
import { useHttpClient } from "@/functions/app"
import { useViewStack } from "@/views/Main/view-stacks"
import { usePreviewContext, useMetadataEndpoint } from "./inject"

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
        const { ui: { drawerTab } } = usePreviewContext()
        const { data, setData } = useMetadataEndpoint()

        const closeDrawerTab = () => drawerTab.value = undefined

        return () => <MetaTagEditor tags={data.value?.tags ?? []}
                                    topics={data.value?.topics ?? []}
                                    authors={data.value?.authors ?? []}
                                    tagme={data.value?.tagme ?? []}
                                    setData={setData} onClose={closeDrawerTab}/>
    }
})

const ListView = defineComponent({
    setup() {
        const {
            dataView,
            endpoint,
            viewController: { fitType, columnNum },
            selector: { selected, lastSelected }
        } = usePreviewContext().images

        const updateSelected = (selectedValue: number[], lastSelectedValue: number | null) => {
            selected.value = selectedValue
            lastSelected.value = lastSelectedValue
        }

        const openMethod = useOpenMethod()

        const menu = useContextmenu(openMethod)

        //TODO 做一个通过拖放引入新项的功能。
        //      拖放illust至此时，打开一个modal，提示列表内容，勾选要放入的项，然后放入。(注意甄别出原来就在当前集合的项，以及提示那些现在在其他集合的项)
        //      目前还没有哪里能拖拽illust。给IllustGrid加入这个功能。(当然拖放不是IllustGrid的功能，它是一个独有功能)
        //      最后，从剪贴板导入的功能使用相同的接口，即打开一个modal。(虽然剪贴板还没做)

        return () => <IllustGrid data={markRaw(dataView.data.value)} onDataUpdate={dataView.dataUpdate} draggable={true}
                                 queryEndpoint={markRaw(endpoint.proxy)} fitType={fitType.value} columnNum={columnNum.value}
                                 selected={selected.value} lastSelected={lastSelected.value} onSelect={updateSelected}
                                 onRightClick={menu.popup} onDblClick={openMethod.clickToOpenDetail} onEnter={openMethod.enterToOpenDetail}/>
    }
})

function useContextmenu(openMethod: ReturnType<typeof useOpenMethod>) {
    const navigator = useNavigator()
    const { switchFavorite, createNewCollection, deleteItem, removeItemFromCollection } = useContextOperator()

    //TODO 完成collection右键菜单的功能; 将各个主要功能的实现更改至与selector相关的实现方式上, 注意处理点击项不属于选择列表时的情况
    const menu = useDynamicPopupMenu<Illust>(illust => [
        {type: "normal", label: "查看详情", click: illust => openMethod.clickToOpenDetail(illust.id)},
        {type: "separator"},
        {type: "normal", label: "在新窗口中打开", click: openInNewWindow},
        {type: "normal", label: "显示信息预览"},
        {type: "separator"},
        illust.favorite
            ? {type: "normal", label: "取消标记为收藏", click: illust => switchFavorite(illust, false)}
            : {type: "normal", label: "标记为收藏", click: illust => switchFavorite(illust, true)},
        {type: "separator"},
        {type: "normal", label: "加入剪贴板"},
        {type: "normal", label: "从剪贴板引入项"},
        {type: "separator"},
        {type: "normal", label: "拆分至新集合", click: illust => createNewCollection(illust.id)},
        {type: "normal", label: "创建画集"},
        {type: "normal", label: "创建关联组"},
        {type: "normal", label: "添加到文件夹"},
        {type: "normal", label: "添加到\"X\""},
        {type: "normal", label: "添加到临时文件夹"},
        {type: "separator"},
        {type: "normal", label: "导出"},
        {type: "separator"},
        {type: "normal", label: "删除项目", click: deleteItem},
        {type: "normal", label: "从集合移除此项目", click: removeItemFromCollection}
    ])

    const openInNewWindow = (illust: Illust) => {
        if(illust.type === "IMAGE") navigator.newWindow.preferences.image(illust.id)
        else navigator.newWindow.preferences.collection(illust.id)
    }

    return menu
}

function useOpenMethod() {
    const { dataView, endpoint, selector: { selected }, scrollView } = usePreviewContext().images
    const viewStacks = useViewStack()

    const onImageViewClose = (illustId: number) => {
        //image view关闭时，回调通知list view它最后访问的illustId，以使list view导航到相应的illust上
        const index = dataView.proxy.syncOperations.find(i => i.id === illustId)
        if(index !== undefined) scrollView.navigateTo(index)
    }

    const openAll = (illustId: number) => {
        const currentIndex = dataView.proxy.syncOperations.find(i => i.id === illustId)
        if(currentIndex !== undefined) {
            const data = createSliceOfAll(endpoint.instance.value)
            viewStacks.openImageView(data, currentIndex, onImageViewClose)
        }
    }

    const openList = (selected: number[], currentIndex: number) => {
        const indexList = selected
            .map(selectedId => dataView.proxy.syncOperations.find(i => i.id === selectedId))
            .filter(index => index !== undefined) as number[]
        const data = createSliceOfList(endpoint.instance.value, indexList)

        viewStacks.openImageView(data, currentIndex, onImageViewClose)
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
    const toast = useToast()
    const httpClient = useHttpClient()
    const messageBox = useMessageBox()
    const viewStack = useViewStack()

    const imageFastEndpoint = useFastObjectEndpoint({
        update: httpClient => httpClient.illust.image.update,
        delete: httpClient => httpClient.illust.image.delete
    })
    const imageRelatedFastEndpoint = useFastObjectEndpoint({
        update: httpClient => httpClient.illust.image.relatedItems.update
    })

    const { images: { dataView, endpoint, selector: { selected } }, data: { toastRefresh, target, setTargetData } } = usePreviewContext()

    const switchFavorite = async (illust: Illust, favorite: boolean) => {
        const ok = await imageFastEndpoint.setData(illust.id, { favorite })

        if(ok) {
            const index = dataView.proxy.syncOperations.find(i => i.id === illust.id)
            if(index !== undefined) {
                dataView.proxy.syncOperations.modify(index, {...illust, favorite})
            }
        }
    }

    const createNewCollection = async (illustId: number) => {
        if(await messageBox.showYesNoMessage("confirm", "确定要拆分生成新的集合吗？", "这些项将从当前集合中移除。")) {
            const images = selected.value.length > 0 ? [...selected.value] : [illustId]
            const res = await httpClient.illust.collection.create({images})
            if(res.ok) {
                //将所有项从当前数据视图中移除。然而query endpoint的设计不适合连续删除，因此更好的选择是直接刷新以下
                endpoint.refresh()
                //创建成功后打开新集合的详情页面
                viewStack.openCollectionView(res.data.id)
                //直接通知上层刷新列表以适应变化
                toastRefresh()
            }else{
                toast.handleException(res.exception)
            }
        }
    }

    const deleteItem = async (illust: Illust) => {
        if(await messageBox.showYesNoMessage("warn", "确定要删除此项吗？", "此操作不可撤回。")) {
            const ok = await imageFastEndpoint.deleteData(illust.id)

            if(ok) {
                const index = dataView.proxy.syncOperations.find(i => i.id === illust.id)
                if(index !== undefined) {
                    dataView.proxy.syncOperations.remove(index)
                }
                //由于从集合删除项目产生的变化不大，因此做一些精细的操作来更新上层数据
                setTargetData({childrenCount: target.value!.childrenCount! - 1})
                if(index === 0 && dataView.data.value.metrics.total! > 0) {
                    //移除首位的情况下，需要更新此collection的封面
                    const first = dataView.proxy.syncOperations.retrieve(0)
                    if(first !== undefined) setTargetData({thumbnailFile: first.thumbnailFile})
                }
            }
        }
    }

    const removeItemFromCollection = async (illust: Illust) => {
        if(await messageBox.showYesNoMessage("warn", "确定要从集合移除此项吗？")) {
            const ok = await imageRelatedFastEndpoint.setData(illust.id, {collectionId: null})

            if(ok) {
                const index = dataView.proxy.syncOperations.find(i => i.id === illust.id)
                if(index !== undefined) {
                    dataView.proxy.syncOperations.remove(index)
                }
                //直接通知上层刷新列表以适应变化
                toastRefresh()
            }
        }
    }

    return {switchFavorite, createNewCollection, deleteItem, removeItemFromCollection}
}
