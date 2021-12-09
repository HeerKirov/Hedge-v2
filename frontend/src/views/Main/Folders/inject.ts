import { computed, onMounted, ref, Ref, watch } from "vue"
import { FolderCreateForm, FolderExceptions, FolderTreeNode, FolderType } from "@/functions/adapter-http/impl/folder"
import { useRouterQueryNumber } from "@/functions/feature/router"
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
        createFolder(form: FolderCreateForm, handleError?: (e: FolderExceptions["create"]) => FolderExceptions["create"] | void): Promise<boolean>
        /**
         * 更改folder。
         */
        updateFolder(id: number, form: {title?: string}, handle?: (e: FolderExceptions["update"]) => FolderExceptions["update"] | void): Promise<boolean>
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
        searchText: Ref<string>
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
    /**
     * pin fast endpoint。
     */
    pin: {
        set(folderId: number): void
        unset(folderId: number): void
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

    const pin = usePinOperator(list.indexedData)

    const pane = usePane()

    const view = usePanelView()

    return {list, pin, pane, view}
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

    const { data: filteredData, searchText } = useDataFilter(data)

    const indexedData = useIndexedData(data)

    const expandedInfo = useExpandedInfo(indexedData)

    const operators = useOperators(indexedData, refresh)

    const editable = useLocalStorageWithDefault<boolean>("folder-list/editable", false)

    const creator = useCreatorRow()

    return {data: filteredData, indexedData, refresh, expandedInfo, searchText, ...operators, editable, creator}
}

function useDataFilter(originData: Ref<FolderTreeNode[]>) {
    const searchText = ref("")

    function filter(node: FolderTreeNode): FolderTreeNode | null {
        if(node.type === "NODE") {
            if(node.title.toLowerCase().includes(searchText.value.toLowerCase())) {
                return node
            }else{
                const children = (node.children ?? []).map(filter).filter(i => i !== null) as FolderTreeNode[]
                if(children.length) {
                    return {...node, children}
                }else{
                    return null
                }
            }
        }else{
            if(node.title.toLowerCase().includes(searchText.value.toLowerCase())) {
                return node
            }else{
                return null
            }
        }
    }

    const data = computed(() => originData.value.map(filter).filter(i => i !== null) as FolderTreeNode[])

    return {data, searchText}
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
            return true
        }else{
            const e = handleError?.(res.exception)
            if(e !== undefined) toast.handleException(e)
            return false
        }
    }

    const updateFolder = async (id: number, form: {title?: string}, handleError?: (e: FolderExceptions["update"]) => FolderExceptions["update"] | void) => {
        if(await fastEndpoint.setData(id, form, handleError)) {
            const target = indexedData.value[id]
            if(target) {
                if(form.title !== undefined) target.title = form.title
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

function usePinOperator(indexedData: Ref<{[id: number]: FolderTreeNode}>) {
    const endpoint = useFastObjectEndpoint({
        update: httpClient => httpClient.folder.pin.set,
        delete: httpClient => httpClient.folder.pin.unset
    })

    return {
        async set(folderId: number) {
            const ok = await endpoint.setData(folderId, undefined)
            if(ok) {
                const d = indexedData.value[folderId]
                if(d) {
                    d.pinned = true
                }
            }
        },
        async unset(folderId: number) {
            const ok = await endpoint.deleteData(folderId)
            if(ok) {
                const d = indexedData.value[folderId]
                if(d) {
                    d.pinned = false
                }
            }
        }
    }
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
