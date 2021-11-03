import { computed, onMounted, ref, Ref } from "vue"
import { FolderTreeNode } from "@/functions/adapter-http/impl/folder"
import { useRouterQueryNumber } from "@/functions/utils/properties/router-property"
import { installation } from "@/functions/utils/basic"
import { useToast } from "@/functions/module/toast"
import { useHttpClient } from "@/functions/app"

export interface FolderContext {
    list: {
        data: Ref<FolderTreeNode[]>
        refresh(): void
        expandedInfo: {
            get(key: number): boolean
            set(key: number, value: boolean): boolean
            setAllForParent(key: number, value: boolean): void
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
    const httpClient = useHttpClient()
    const toast = useToast()

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

    const expandedInfo = useExpandedInfo()

    return {data, refresh, expandedInfo}
}

function useExpandedInfo() {
    const expandedInfo = ref<{[key: number]: boolean}>({})

    const get = (key: number): boolean => expandedInfo.value[key] ?? true

    const set = (key: number, value: boolean) => expandedInfo.value[key] = value

    const setAllForParent = (key: number, value: boolean) => {
        //TODO
    }

    const setAllForChildren = (key: number, value: boolean) => {
        //TODO
    }

    return {get, set, setAllForParent, setAllForChildren}
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
