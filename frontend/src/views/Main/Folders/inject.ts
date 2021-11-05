import { computed, onMounted, ref, Ref, watch } from "vue"
import { FolderCreateForm, FolderExceptions, FolderTreeNode, FolderType } from "@/functions/adapter-http/impl/folder"
import { useRouterQueryNumber } from "@/functions/utils/properties/router-property"
import { useFastObjectEndpoint } from "@/functions/utils/endpoints/object-fast-endpoint"
import { installation } from "@/functions/utils/basic"
import { useToast } from "@/functions/module/toast"
import { useHttpClient, useLocalStorageWithDefault } from "@/functions/app"

export interface FolderContext {
    list: {
        /**
         * 数据。
         */
        data: Ref<FolderTreeNode[]>
        /**
         * 按id取用的数据。
         */
        indexedData: Ref<{[id: number]: FolderTreeNode}>
        /**
         * 刷新以重载数据。
         */
        refresh(): void
        /**
         * 添加新的folder。
         */
        createFolder(form: FolderCreateForm, handleError?: (e: FolderExceptions["create"]) => FolderExceptions["create"] | void): void
        /**
         * 更改folder。
         */
        updateFolder(id: number, form: {title?: string, query?: string}, handle?: (e: FolderExceptions["update"]) => FolderExceptions["update"] | void): Promise<boolean>
        /**
         * 移动folder的位置。
         */
        moveFolder(id: number, parentId: number | null, ordinal: number): void
        /**
         * 删除folder。这会级联删除下属所有folder。
         */
        deleteFolder(id: number): void
        /**
         * 展开与折叠信息。
         */
        expandedInfo: {
            get(key: number): boolean
            set(key: number, value: boolean): boolean
            setAllForChildren(key: number, value: boolean): void
        },
        /**
         * 可编辑锁。
         */
        editable: Ref<boolean>
        /**
         * 创建用的临时行。
         */
        creator: {
            position: Readonly<Ref<FolderCreateTemplate | null>>
            type: Ref<FolderType>
            openCreatorRow(parentId: number | null | undefined, ordinal: number | null | undefined): void
            closeCreatorRow(): void
        }
    }
    pane: {
        detailMode: Readonly<Ref<number | null>>
        openDetailPane(id: number): void
        closePane(): void
    }
    view: {
        detailView: Readonly<Ref<number | null>>
        openDetailView(id: number): void
        closeView(): void
    }
}

export interface FolderCreateTemplate {
    parentId: number | undefined
    ordinal: number | undefined
}

export const [installFolderContext, useFolderContext] = installation(function (): FolderContext {
    const list = useFolderListContext()

    const pane = usePane()

    const view = usePanelView()

    return {list, pane, view}
})

function useFolderListContext() {
    const toast = useToast()
    const httpClient = useHttpClient()

    const data = ref<FolderTreeNode[]>([])

    const refresh = async () => {
        const res = await httpClient.folder.tree({})
        if(res.ok) {
            data.value = res.data
        }else if(res.exception) {
            toast.handleException(res.exception)
        }
    }

    onMounted(refresh)

    const indexedData = useIndexedData(data)

    const expandedInfo = useExpandedInfo(indexedData)

    const operators = useOperators(indexedData, refresh)

    const editable = useLocalStorageWithDefault<boolean>("folder-list/editable", false)

    const creator = useCreatorRow()

    return {data, indexedData, refresh, expandedInfo, ...operators, editable, creator}
}

function useIndexedData(data: Ref<FolderTreeNode[]>) {
    const indexedData = ref<{[id: number]: FolderTreeNode}>({})

    watch(data, data => {
        const info: {[key: number]: FolderTreeNode} = {}
        for(let i = 0; i < data.length; ++i) {
            loadFolderNode(info, data[i], i)
        }
        indexedData.value = info
    })

    function loadFolderNode(info: {[key: number]: FolderTreeNode}, folder: FolderTreeNode, ordinal: number, address: {id: number, title: string}[] = []) {
        info[folder.id] = folder

        if(folder.children?.length) {
            const nextAddress = [...address, {id: folder.id, title: folder.title}]
            for (let i = 0; i < folder.children.length; i++) {
                loadFolderNode(info, folder.children[i], i, nextAddress)
            }
        }
    }

    return indexedData
}

function useOperators(indexedData: Ref<{[id: number]: FolderTreeNode}>, refresh: () => void) {
    const toast = useToast()
    const httpClient = useHttpClient()

    const fastEndpoint = useFastObjectEndpoint({
        get: httpClient => httpClient.folder.get,
        update: httpClient => httpClient.folder.update,
        delete: httpClient => httpClient.folder.delete
    })

    const createFolder = async (form: FolderCreateForm, handleError?: (e: FolderExceptions["create"]) => FolderExceptions["create"] | void) => {
        const res = await httpClient.folder.create(form)
        if(res.ok) {
            refresh()
        }else{
            const e = handleError?.(res.exception)
            if(e !== undefined) toast.handleException(e)
        }
    }

    const updateFolder = async (id: number, form: {title?: string, query?: string}, handleError?: (e: FolderExceptions["update"]) => FolderExceptions["update"] | void) => {
        if(await fastEndpoint.setData(id, form, handleError)) {
            const target = indexedData.value[id]
            if(target) {
                if(form.title !== undefined) target.title = form.title
                if(form.query !== undefined) target.query = form.query
            }
            return true
        }
        return false
    }

    const moveFolder = async (id: number, parentId: number | null, ordinal: number) => {
        if(await fastEndpoint.setData(id, {parentId, ordinal})) {
            refresh()
        }
    }

    const deleteFolder = async (id: number) => {
        if(await fastEndpoint.deleteData(id)) {
            refresh()
        }
    }

    return {createFolder, updateFolder, moveFolder, deleteFolder}
}

function useExpandedInfo(indexedData: Ref<{[key: number]: FolderTreeNode}>) {
    const expandedInfo = ref<{[key: number]: boolean}>({})

    const get = (key: number): boolean => expandedInfo.value[key] ?? true

    const set = (key: number, value: boolean) => expandedInfo.value[key] = value

    const setAllForChildren = (key: number, value: boolean) => {
        const deepSet = (f: FolderTreeNode, value: boolean) => {
            set(f.id, value)
            if(f.children) {
                for(const child of f.children) {
                    deepSet(child, value)
                }
            }
        }

        const info = indexedData.value[key]
        if(info) deepSet(info, value)
    }

    return {get, set, setAllForChildren}
}

function useCreatorRow() {
    const position = ref<FolderCreateTemplate | null>(null)
    const type = ref<FolderType>("FOLDER")

    const openCreatorRow = (parentId: number | null | undefined, ordinal: number | null | undefined) => position.value = {parentId: parentId ?? undefined, ordinal: ordinal ?? undefined}

    const closeCreatorRow = () => position.value = null

    return {position, type, openCreatorRow, closeCreatorRow}
}

function usePane() {
    const detailMode = ref<number | null>(null)

    const openDetailPane = (id: number) => detailMode.value = id

    const closePane = () => detailMode.value = null

    return {detailMode, openDetailPane, closePane}
}

function usePanelView() {
    const detailView = useRouterQueryNumber("MainFolders", "detail")

    const openDetailView = (id: number) => {
        detailView.value = id
    }
    const closeView = () => {
        detailView.value = null
    }

    return {detailView, openDetailView, closeView}
}

export function useExpandedValue(key: Ref<number>) {
    const { get, set } = useFolderContext().list.expandedInfo
    return computed<boolean>({
        get: () => get(key.value),
        set: value => set(key.value, value)
    })
}
