import { computed, onMounted, readonly, Ref, ref, unref, watch, toRaw } from "vue"
import { DetailTag, TagTreeNode, TagUpdateForm } from "@/functions/adapter-http/impl/tag"
import { useNotification } from "@/functions/module"
import { useHttpClient } from "@/functions/app"
import { useFastObjectEndpoint, ObjectEndpoint } from "@/functions/utils/endpoints/object-fast-endpoint"
import { installation } from "@/functions/utils/basic"

export interface TagPaneContext {
    detailMode: Readonly<Ref<number | null>>
    createMode: Readonly<Ref<TagCreateTemplate | null>>
    openCreatePane(template?: TagCreateTemplate): void
    openDetailPane(id: number): void
    closePane(): void
}

export interface TagCreateTemplate {
    parentId?: number
    ordinal?: number
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
     * 用于list view展示的description属性的缓存值。在没有值时，自动调API去取；更新description时应手动更新此缓存。
     */
    descriptionCache: {
        get(key: number): string | undefined
        set(key: number, value: string): void
    }
    fastEndpoint: ObjectEndpoint<number, DetailTag, TagUpdateForm>
    /**
     * 添加新的tag。通过此方法添加不会重载数据，在前端同步完成所有处理，以减少开销。
     */
    syncAddTag(id: number): void
    /**
     * 更新tag。通过此方法更改不会重载数据，在前端同步完成所有处理，以减少开销。
     */
    syncUpdateTag(tag: DetailTag): void
    /**
     * 删除tag。这会级联删除下属所有tag。通过此方法删除不会重载数据，在前端同步完成所有处理，以减少开销。
     */
    syncDeleteTag(id: number): void
}

export interface IndexedInfo {
    //原始tag对象的引用
    tag: TagTreeNode
    //tag的地址段
    address: {id: number, name: string}[]
    //tag的父标签的id
    parentId: number | null
    //tag在其父标签下的顺位，从0开始
    ordinal: number
    //tag是否是group的成员
    isGroupMember: IsGroupMember
}

type IsGroupMember = "YES" | "SEQUENCE" | "NO"

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
    const createMode = ref<TagCreateTemplate | null>(null)

    const openCreatePane = (template?: TagCreateTemplate) => {
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

    return {detailMode: readonly(detailMode), createMode: readonly(createMode), openCreatePane, openDetailPane, closePane}
})

export const [installTagListContext, useTagListContext] = installation(function(): TagListContext {
    const { loading, data: requestedData } = useTagTreeEndpoint()

    const { data, indexedInfo, add, remove } = useIndexedData(requestedData)

    const fastEndpoint = useFastObjectEndpoint({
        get: httpClient => httpClient.tag.get,
        update: httpClient => httpClient.tag.update,
        delete: httpClient => httpClient.tag.delete
    })

    const descriptionCache = useDescriptionCache(fastEndpoint)

    const syncAddTag = (id: number) => {
        fastEndpoint.getData(id).then(tag => {
            if(tag) {
                if(indexedInfo.value[id]) {
                    //虽然不知道为什么，但是这个tag已存在。那么选择更新此tag。
                    syncUpdateTag(tag)
                }else{
                    const node: TagTreeNode = {
                        id: tag.id,
                        name: tag.name,
                        otherNames: tag.otherNames,
                        type: tag.type,
                        group: tag.group,
                        color: tag.color,
                        children: [] //新建的tag，其children必为空
                    }
                    add(node, tag.parentId, tag.ordinal)

                    //修改其在description cache中的值
                    descriptionCache.set(id, tag.description)
                }
                console.log(data.value)
                console.log(indexedInfo.value)
            }
        })
    }

    const syncUpdateTag = (tag: DetailTag) => {
        function updateColorForAllChildren(tag: TagTreeNode, color: string | null) {
            tag.color = color
            if(tag.children?.length) {
                for(const child of tag.children) {
                    updateColorForAllChildren(child, color)
                }
            }
        }

        function updateAddressForAllChildren(info: IndexedInfo) {
            if(info.tag.children?.length) {
                const newAddress = [...info.address, {id: info.tag.id, name: info.tag.name}]
                for(const child of info.tag.children) {
                    const childInfo = indexedInfo.value[child.id]
                    if(childInfo) {
                        childInfo.address = newAddress
                        updateAddressForAllChildren(childInfo)
                    }
                }
            }
        }

        function updateGroupPropsForChildren(children: TagTreeNode[], isGroupMember: IsGroupMember) {
            for(const child of children) {
                const info = indexedInfo.value[child.id]
                if(info) {
                    info.isGroupMember = isGroupMember
                }
            }
        }

        const info = indexedInfo.value[tag.id]
        if(info) {
            info.tag.otherNames = tag.otherNames
            info.tag.type = tag.type
            if(info.tag.color !== tag.color) {
                //当颜色改变时，需要递归修改其所有子元素的颜色
                updateColorForAllChildren(info.tag, tag.color)
            }
            if(info.tag.name !== tag.name) {
                //name改变时，需要递归修改其所有子元素的address
                info.tag.name = tag.name
                updateAddressForAllChildren(info)
            }
            if(info.tag.group !== tag.group) {
                //group改变时，需要修改其直接子元素的group设定
                info.tag.group = tag.group

                if(info.tag.children) {
                    const isGroupMember: IsGroupMember
                        = info.tag.group === "FORCE_AND_SEQUENCE" || info.tag.group === "SEQUENCE" ? "SEQUENCE"
                        : info.tag.group === "YES" || info.tag.group === "FORCE" ? "YES"
                        : "NO"

                    updateGroupPropsForChildren(info.tag.children, isGroupMember)
                }
            }
            //修改其在description cache中的值
            descriptionCache.set(tag.id, tag.description)
        }
    }

    const syncDeleteTag = remove

    return {loading, data, indexedInfo, descriptionCache, fastEndpoint, syncAddTag, syncUpdateTag, syncDeleteTag}
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
        for(let i = 0; i < requestedData.length; ++i) {
            loadTagNode(info, requestedData[i], i)
        }
        indexedInfo.value = info
    })

    function loadTagNode(info: {[key: number]: IndexedInfo}, tag: TagTreeNode, ordinal: number, isGroupMember: IsGroupMember = "NO", address: {id: number, name: string}[] = []) {
        const parentId = address.length ? address[address.length - 1].id : null

        info[tag.id] = {tag, address, parentId, ordinal, isGroupMember}

        if(tag.children?.length) {
            const nextAddress = [...address, {id: tag.id, name: tag.name}]
            const isGroupMember: IsGroupMember
                = tag.group === "FORCE_AND_SEQUENCE" || tag.group === "SEQUENCE" ? "SEQUENCE"
                : tag.group === "YES" || tag.group === "FORCE" ? "YES"
                : "NO"
            for (let i = 0; i < tag.children.length; ++i) {
                loadTagNode(info, tag.children[i], i, isGroupMember, nextAddress)
            }
        }
    }

    /**
     * 向标签树中的位置追加节点。同步生成其indexed data。
     */
    const add = (node: TagTreeNode, parentId: number | null, ordinal: number) => {
        function updateIndexedOrdinal(items: TagTreeNode[]) {
            //使列表中的节点在indexed info中的ordinal数值 + 1。
            for(const item of items) {
               const info = indexedInfo.value[item.id]
               if(info) info.ordinal += 1
            }
        }

        if(parentId == null) {
            //首先更新其后的兄弟元素的ordinal
            updateIndexedOrdinal(data.value.slice(ordinal))
            //将新node插入到根列表下
            data.value.splice(ordinal, 0, node)
            //然后更新其在indexed info中的索引
            loadTagNode(indexedInfo.value, node, ordinal)
        }else{
            const parentInfo = indexedInfo.value[parentId]
            if(parentInfo) {
                const nextAddress = [...toRaw(parentInfo.address), {id: parentInfo.tag.id, name: parentInfo.tag.name}]
                const isGroupMember: IsGroupMember
                    = node.group === "FORCE_AND_SEQUENCE" || node.group === "SEQUENCE" ? "SEQUENCE"
                    : node.group === "YES" || node.group === "FORCE" ? "YES"
                    : "NO"
                if(parentInfo.tag.children == null) {
                    parentInfo.tag.children = []
                }
                //首先更新其后的兄弟元素的ordinal
                updateIndexedOrdinal(parentInfo.tag.children.slice(ordinal))
                //将新node插入到其父节点的孩子列表下
                parentInfo.tag.children.splice(ordinal, 0, node)
                //然后更新其在indexed info中的索引
                //从列表再取一次是为了使其获得响应性
                const nodeRef = parentInfo.tag.children[ordinal]
                loadTagNode(indexedInfo.value, nodeRef, ordinal, isGroupMember, nextAddress)
            }else{
                console.error(`Error occurred while adding tag ${node.id}: cannot find parent tag ${parentId} in indexed info.`)
            }
        }
    }

    /**
     * 移除一个节点及其所有子节点，同步移除其indexed data。
     */
    const remove = (id: number) => {
        function updateIndexedOrdinal(items: TagTreeNode[]) {
            //使列表中的节点在indexed info中的ordinal数值 - 1。
            for(const item of items) {
                const info = indexedInfo.value[item.id]
                if(info) info.ordinal -= 1
            }
        }

        function processNode(id: number) {
            const info = indexedInfo.value[id]
            if(info) {
                delete indexedInfo.value[id]
                if(info.tag.children?.length) {
                    for(const child of info.tag.children) {
                        processNode(child.id)
                    }
                }
            }
        }

        const info = indexedInfo.value[id]
        if(info) {
            if(info.parentId != null) {
                //有parent时，将其从parent的子标签列表移除
                const parentInfo = indexedInfo.value[info.parentId]
                if(parentInfo && parentInfo.tag.children != null) {
                    const index = parentInfo.tag.children.findIndex(t => t.id === id)
                    parentInfo.tag.children.splice(index, 1)
                    updateIndexedOrdinal(parentInfo.tag.children.slice(index))
                }else{
                    console.error(`Error occurred while deleting tag ${id}: cannot find parent tag ${info.parentId} in indexed info.`)
                }
            }else{
                //没有parent时，从根列表移除
                const index = data.value.findIndex(t => t.id === id)
                data.value.splice(index, 1)
                updateIndexedOrdinal(data.value.slice(index))
            }
            processNode(id)
        }else{
            console.error(`Error occurred while deleting tag${id}: not exist.`)
        }
    }

    return {data, indexedInfo, add, remove}
}

function useDescriptionCache(endpoint: ObjectEndpoint<number, DetailTag, unknown>) {
    const descriptions: Ref<{[key: number]: string}> = ref({})

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
