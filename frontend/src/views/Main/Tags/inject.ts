import { computed, onMounted, Ref, ref, watch } from "vue"
import { TagTreeNode } from "@/functions/adapter-http/impl/tag"
import { useNotification } from "@/functions/module"
import { useHttpClient } from "@/functions/app"
import { useFastObjectEndpoint } from "@/functions/utils/endpoints/object-fast-endpoint"
import { installation } from "@/functions/utils/basic"

export interface TagPaneContext {
    detailMode: Ref<number | null>
    openDetailPane(id: number): void
    closePane(): void
}

export interface TagListContext {
    /**
     * 当前加载状态。
     */
    loading: Ref<boolean>
    /**
     * 树状的原始数据。
     */
    data: Ref<TagTreeNode[]>
    /**
     * 根据id索引的数据。
     */
    indexedInfo: Ref<{[key: number]: IndexedInfo}>
    /**
     * 快捷函数：更新当前数据中，指定tag下所有tag的color属性。
     */
    updateColorForAllChildren(tag: TagTreeNode, color: string | null): void
    /**
     * 用于list view展示的description属性的缓存值。在没有值时，自动调API去取；更新description时应手动更新此缓存。
     */
    descriptionCache: {
        get(key: number): string | undefined
        set(key: number, value: string): void
    }
    /**
     * 删除指定的tag。这会级联删除下属所有tag。通过此方法删除不会重载数据，在前端同步完成所有处理，以减少开销。
     */
    deleteTag(id: number): void
}

export interface IndexedInfo {
    //原始tag对象的引用
    tag: TagTreeNode
    //tag的地址段
    address: {id: number, name: string}[]
    //tag是否是group的成员
    member: boolean
    //tag是否是序列化group的成员，指定其序列化顺位
    memberIndex?: number
}

export interface ExpandedInfoContext {
    /**
     * 获得折叠状态。
     */
    get(key: number): boolean
    /**
     * 设定折叠状态。
     */
    set(key: number, value: boolean): void
    /**
     * 设定当前节点及其所有子节点的折叠状态。
     */
    setAllForChildren(key: number, value: boolean): void
}

export const [installTagPaneContext, useTagPaneContext] = installation(function(): TagPaneContext {
    const detailMode = ref<number | null>(null)

    const openDetailPane = (id: number) => {
        detailMode.value = id
    }

    const closePane = () => {
        detailMode.value = null
    }

    return {detailMode, openDetailPane, closePane}
})

export const [installTagListContext, useTagListContext] = installation(function(): TagListContext {
    const { loading, data: requestedData } = useTagTreeEndpoint()

    const { data, indexedInfo } = useIndexedData(requestedData)

    const descriptionCache = useDescriptionCache()

    const updateColorForAllChildren = (tag: TagTreeNode, color: string | null) => {
        tag.color = color
        if(tag.children?.length) {
            for(const child of tag.children) {
                updateColorForAllChildren(child, color)
            }
        }
    }

    const deleteTag = (id: number) => {
        //TODO
    }

    return {loading, data, indexedInfo, updateColorForAllChildren, descriptionCache, deleteTag}
})

function useTagTreeEndpoint() {
    const httpClient = useHttpClient()
    const { handleException } = useNotification()

    const loading = ref(true)
    const data = ref<TagTreeNode[]>([])

    const refresh = async () => {
        loading.value = true
        const res = await httpClient.tag.tree({})
        if(res.ok) {
            data.value = res.data
        }else if(res.exception) {
            handleException(res.exception)
        }
        loading.value = false
    }

    onMounted(refresh)

    return {loading, data, refresh}
}

function useIndexedData(requestedData: Ref<TagTreeNode[]>) {
    const data = ref<TagTreeNode[]>([])
    const indexedInfo = ref<{[key: number]: IndexedInfo}>({})

    watch(requestedData, requestedData => {
        data.value = requestedData
        const info: {[key: number]: IndexedInfo} = {}
        for(const node of requestedData) {
           loadTagNode(info, node)
        }
        indexedInfo.value = info
    })

    function loadTagNode(info: {[key: number]: IndexedInfo}, tag: TagTreeNode, address: {id: number, name: string}[] = [], member: boolean = false, memberIndex: number | undefined = undefined) {
        info[tag.id] = {tag, address, member, memberIndex}
        if(tag.children?.length) {
            const nextAddress = [...address, {id: tag.id, name: tag.name}]
            const isGroup = tag.group !== "NO"
            const isSequence = tag.group === "SEQUENCE" || tag.group === "FORCE_AND_SEQUENCE"
            for (let i = 0; i < tag.children.length; i++) {
                loadTagNode(info, tag.children[i], nextAddress, isGroup, isSequence ? i : undefined)
            }
        }
    }

    return {data, indexedInfo}
}

function useDescriptionCache() {
    const descriptions: Ref<{[key: number]: string}> = ref({})

    const endpoint = useFastObjectEndpoint({
        get: httpClient => httpClient.tag.get
    })

    const loadDescription = async (key: number) => {
        const d = await endpoint.getData(key)
        if(d) set(key, d.description)
    }

    const set = (key: number, value: string) => {
        const enterIndex = value.indexOf("\n")
        descriptions.value[key] = enterIndex >= 0 ? value.substr(0, enterIndex) : value
    }

    const get = (key: number): string | undefined => {
        const value = descriptions.value[key]
        if(value != undefined) {
            return value
        }
        try {
            return undefined
        }finally{
            loadDescription(key).finally()
        }
    }

    return {get, set}
}

export function useDescriptionValue(key: Ref<number>) {
    const { descriptionCache } = useTagListContext()
    return computed<string | undefined>({
        get: () => descriptionCache.get(key.value),
        set(value) {
            if(value != undefined) {
                descriptionCache.set(key.value, value)
            }
        }
    })
}

export const [installExpandedInfo, useExpandedInfo] = installation(function(): ExpandedInfoContext {
    const { indexedInfo } = useTagListContext()

    const expandedInfo = ref<{[key: number]: boolean}>({})

    const get = (key: number): boolean => expandedInfo.value[key] ?? false
    const set = (key: number, value: boolean) => expandedInfo.value[key] = value
    const setAllForChildren = (key: number, value: boolean) => {
        const deepSet = (tag: TagTreeNode, value: boolean) => {
            set(tag.id, value)
            if(tag.children) {
                for(const child of tag.children) {
                    deepSet(child, value)
                }
            }
        }

        const info = indexedInfo.value[key]
        if(info) deepSet(info.tag, value)
    }

    return {get, set, setAllForChildren}
})

export function useExpandedValue(key: Ref<number>) {
    const { get, set } = useExpandedInfo()
    return computed<boolean>({
        get: () => get(key.value),
        set: value => set(key.value, value)
    })
}
