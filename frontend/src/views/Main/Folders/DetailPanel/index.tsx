import { defineComponent, markRaw, watch } from "vue"
import TopBarLayout from "@/layouts/layouts/TopBarLayout"
import { ColumnNumButton, DataRouter, FitTypeButton } from "@/layouts/topbars"
import IllustGrid, { FitType, GridContextOperatorResult, useGridContextOperator } from "@/layouts/data/IllustGrid"
import { FolderImage } from "@/functions/adapter-http/impl/folder"
import { TypeDefinition } from "@/functions/feature/drag/definition"
import { useAddToFolderService } from "@/layouts/dialogs/AddToFolder"
import { createSliceOfAll, createSliceOfList } from "@/functions/utils/endpoints/query-endpoint"
import { useDynamicPopupMenu } from "@/functions/module/popup-menu"
import { useMessageBox } from "@/functions/module/message-box"
import { useHttpClient } from "@/functions/app"
import { useToast } from "@/functions/module/toast"
import { useSideBarContext } from "@/views/Main/inject"
import { useFolderContext } from "../inject"
import { installDetailContext, useDetailContext } from "./inject"

export default defineComponent({
    setup() {
        const { pushSubItem } = useSideBarContext()
        const { detail: { data } } = installDetailContext()

        watch(data, data => {
            if(data !== null) {
                const title = [...data.parentAddress, data.title].join("/")
                pushSubItem(data.id.toString(), title)
            }
        })

        const topBarLayoutSlots = {
            topBar: () => <TopBarContent/>,
            default: () => <ListView/>
        }
        return () => <TopBarLayout v-slots={topBarLayoutSlots}/>
    }
})

const TopBarContent = defineComponent({
    setup() {
        const { view: { closeView } } = useFolderContext()
        const { viewController: { fitType, columnNum }, detail: { data } } = useDetailContext()

        const setFitType = (v: FitType) => fitType.value = v
        const setColumnNum = (v: number) => columnNum.value = v

        return () => <div class="middle-layout">
            <div class="layout-container">
                <button class="square button no-drag radius-large is-white mr-1" onClick={closeView}>
                    <span class="icon"><i class="fa fa-times"/></span>
                </button>
                <span class="ml-2 is-size-medium">{data.value?.title}</span>
            </div>
            <div class="layout-container">
                <EditLockButton/>
                <DataRouter/>
                <FitTypeButton value={fitType.value} onUpdateValue={setFitType}/>
                <ColumnNumButton value={columnNum.value} onUpdateValue={setColumnNum}/>
            </div>
        </div>
    }
})

const EditLockButton = defineComponent({
    setup() {
        const { editable } = useDetailContext().viewController
        const click = () => editable.value = !editable.value

        return () => <button class={`square button no-drag radius-large is-${editable.value ? "danger" : "white"}`} onClick={click}>
            <span class="icon"><i class={`fa fa-${editable.value ? "unlock" : "lock"}`}/></span>
        </button>
    }
})


const ListView = defineComponent({
    setup() {
        const {
            dataView, endpoint, scrollView,
            viewController: { fitType, columnNum, editable },
            selector: { selected, lastSelected }
        } = useDetailContext()

        const updateSelected = (selectedValue: number[], lastSelectedValue: number | null) => {
            selected.value = selectedValue
            lastSelected.value = lastSelectedValue
        }

        const operator = useGridContextOperator<FolderImage>({
            dataView, endpoint, scrollView, selected,
            createSliceOfAll: instance => createSliceOfAll(instance, {
                to: data => ({...data, type: "IMAGE", childrenCount: null}),
                from: data => data
            }),
            createSliceOfList: (instance, indexList) => createSliceOfList(instance, indexList, {
                to: data => ({...data, type: "IMAGE", childrenCount: null}),
                from: data => data
            }),
            createCollection: {refreshAfterCreated: true},
            createAlbum: true
        })

        const folderOperator = useFolderOperator()

        const menu = useContextmenu(operator, folderOperator)

        return () => <IllustGrid data={markRaw(dataView.data.value)} onDataUpdate={dataView.dataUpdate} draggable={true} droppable={editable.value}
                                 queryEndpoint={markRaw(endpoint.proxy)} fitType={fitType.value} columnNum={columnNum.value}
                                 selected={selected.value} lastSelected={lastSelected.value} onSelect={updateSelected}
                                 onRightClick={i => menu.popup(i as FolderImage)} onDblClick={operator.clickToOpenDetail} onEnter={operator.enterToOpenDetail} onDataDrop={folderOperator.dropEvent}/>
    }
})

function useContextmenu(operator: GridContextOperatorResult<FolderImage>, folderOperator: ReturnType<typeof useFolderOperator>) {
    //TODO 完成folder illust右键菜单的功能 (信息预览，剪贴板，关联组，目录，导出)
    return useDynamicPopupMenu<FolderImage>(illust => [
        {type: "normal", label: "查看详情", click: i => operator.clickToOpenDetail(i.id)},
        {type: "separator"},
        {type: "normal", label: "在新窗口中打开", click: operator.openInNewWindow},
        {type: "normal", label: "显示信息预览"},
        {type: "separator"},
        illust.favorite
            ? {type: "normal", label: "取消标记为收藏", click: i => operator.modifyFavorite(i, false)}
            : {type: "normal", label: "标记为收藏", click: i => operator.modifyFavorite(i, true)},
        {type: "separator"},
        {type: "normal", label: "加入剪贴板"},
        {type: "separator"},
        {type: "normal", label: "创建图像集合", click: operator.createCollection},
        {type: "normal", label: "创建画集", click: operator.createAlbum},
        {type: "normal", label: "创建关联组"},
        {type: "normal", label: "添加到目录"},
        {type: "normal", label: "添加到\"X\""},
        {type: "normal", label: "添加到临时目录"},
        {type: "separator"},
        {type: "normal", label: "导出"},
        {type: "separator"},
        {type: "normal", label: "删除项目", click: operator.deleteItem},
        {type: "normal", label: "从目录移除此项目", click: i => folderOperator.removeItemFromFolder(i, )},
    ])
}

function useFolderOperator() {
    const toast = useToast()
    const messageBox = useMessageBox()
    const httpClient = useHttpClient()
    const addToFolder = useAddToFolderService()
    const { dataView, endpoint, selector: { selected }, detail: { id } } = useDetailContext()

    const removeItemFromFolder = async (illust: FolderImage) => {
        const images = selected.value.includes(illust.id) ? selected.value : [...selected.value, illust.id]
        if(await messageBox.showYesNoMessage("warn", `确定要从目录移除${images.length > 1 ? "这些" : "此"}项吗？`)) {
            const ok = await httpClient.folder.images.partialUpdate(id.value, {action: "DELETE", images})
            if(ok) {
                if(images.length <= 1) {
                    const index = dataView.proxy.syncOperations.find(i => i.id === illust.id)
                    if(index !== undefined) {
                        dataView.proxy.syncOperations.remove(index)
                    }
                }else{
                    //删除数量大于2时，直接刷新
                    endpoint.refresh()
                }
            }
        }
    }

    const dropEvent = async (insertIndex: number | null, illusts: TypeDefinition["illusts"], mode: "ADD" | "MOVE") => {
        if(mode === "ADD") {
            const images = await addToFolder.existsCheck(illusts.map(i => i.id), id.value)
            if(images !== undefined && images.length > 0) {
                const res = await httpClient.folder.images.partialUpdate(id.value, {action: "ADD", images, ordinal: insertIndex})
                if(res.ok) {
                    //刷新列表数据
                    endpoint.refresh()
                }else{
                    toast.handleException(res.exception)
                }
            }
        }else if(illusts.length > 0) {
            //移动操作直接调用API即可
            const res = await httpClient.folder.images.partialUpdate(id.value, {action: "MOVE", images: illusts.map(i => i.id), ordinal: insertIndex})
            if(res.ok) {
                //刷新列表数据
                endpoint.refresh()
            }else{
                toast.handleException(res.exception)
            }
        }
    }


    return {removeItemFromFolder, dropEvent}
}

