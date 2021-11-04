import { computed, onMounted, ref, Ref, watch } from "vue"
import { FolderCreateForm, FolderTreeNode } from "@/functions/adapter-http/impl/folder"
import { useRouterQueryNumber } from "@/functions/utils/properties/router-property"
import { useFastObjectEndpoint } from "@/functions/utils/endpoints/object-fast-endpoint"
import { installation } from "@/functions/utils/basic"
import { useToast } from "@/functions/module/toast"
import { useHttpClient } from "@/functions/app"

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
        createFolder(form: FolderCreateForm): void
        /**
         * 更改folder。
         */
        updateFolder(id: number, form: {title?: string, query?: string}): void
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
        }
    }
    pane: {
        createMode: Readonly<Ref<FolderCreateTemplate | null>>
        detailMode: Readonly<Ref<number | null>>
        openCreatePane(template?: FolderCreateTemplate): void
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
    parentId?: number
    ordinal?: number
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

    const operators = useOperators(refresh)

    return {data, indexedData, refresh, expandedInfo, ...operators}
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
        const parentId = address.length ? address[address.length - 1].id : null

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

function useOperators(refresh: () => void) {
    const fastEndpoint = useFastObjectEndpoint({
        get: httpClient => httpClient.folder.get,
        update: httpClient => httpClient.folder.update,
        delete: httpClient => httpClient.folder.delete
    })

    const createFolder = (form: FolderCreateForm) => {

    }

    const updateFolder = (id: number, form: {title?: string, query?: string}) => {

    }

    const moveFolder = (id: number, parentId: number | null, ordinal: number) => {

    }

    const deleteFolder = (id: number) => {

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

function usePane() {
    const detailMode = ref<number | null>(null)
    const createMode = ref<FolderCreateTemplate | null>(null)

    const openCreatePane = (template?: FolderCreateTemplate) => {
        createMode.value = template ?? {}
        detailMode.value = null
    }

    const openDetailPane = (id: number) => {
        createMode.value = null
        detailMode.value = id
    }

    const closePane = () => {
        createMode.value = null
        detailMode.value = null
    }

    return {detailMode, createMode, openCreatePane, openDetailPane, closePane}
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
