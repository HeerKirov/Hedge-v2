import { computed, onMounted, Ref, ref, watch } from "vue"
import { TagTreeNode } from "@/functions/adapter-http/impl/tag"
import { useNotification } from "@/functions/module"
import { useHttpClient } from "@/functions/app"
import { installation } from "@/functions/utils/basic"

export interface TagContext {
    loading: Ref<boolean>
    data: Ref<TagTreeNode[]>
    indexedInfo: Ref<{[key: number]: IndexedInfo}>
    detailMode: Ref<number | null>
    openDetailPane(id: number): void
    closePane(): void
}

interface IndexedInfo {
    //原始tag对象的引用
    tag: TagTreeNode
    //tag的地址段
    address: {id: number, name: string}[]
    //tag是否是group的成员
    member: boolean
    //tag是否是序列化group的成员，指定其序列化顺位
    memberIndex?: number
}

export const [installTagContext, useTagContext] = installation(function(): TagContext {
    const { loading, data: requestedData } = useTagTree()

    const { data, indexedInfo } = useIndexedInfo(requestedData)

    const pane = usePane()

    return {loading, data, indexedInfo, ...pane}
})

function useTagTree() {
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

function useIndexedInfo(requestedData: Ref<TagTreeNode[]>) {
    const data = ref<TagTreeNode[]>([])
    const indexedInfo = ref<{[key: number]: IndexedInfo}>({})

    watch(requestedData, requestedData => {
        data.value = requestedData
        const info: {[key: number]: IndexedInfo} = {}
        for(const node of requestedData) {
           processTagNode(info, node)
        }
        indexedInfo.value = info
    })

    function processTagNode(info: {[key: number]: IndexedInfo}, tag: TagTreeNode, address: {id: number, name: string}[] = [], member: boolean = false, memberIndex: number | undefined = undefined) {
        info[tag.id] = {tag, address, member, memberIndex}
        if(tag.children?.length) {
            const nextAddress = [...address, {id: tag.id, name: tag.name}]
            const isGroup = tag.group !== "NO"
            const isSequence = tag.group === "SEQUENCE" || tag.group === "FORCE_AND_SEQUENCE"
            for (let i = 0; i < tag.children.length; i++) {
                processTagNode(info, tag.children[i], nextAddress, isGroup, isSequence ? i : undefined)
            }
        }
    }

    return {data, indexedInfo}
}

function usePane() {
    const detailMode = ref<number | null>(null)

    const openDetailPane = (id: number) => {
        detailMode.value = id
    }

    const closePane = () => {
        detailMode.value = null
    }

    return {detailMode, openDetailPane, closePane}
}

export const [installExpandedInfo, useExpandedInfo] = installation(function() {
    const expandedInfo = ref<{[key: number]: boolean}>({})

    return {expandedInfo}
})

export function useExpandedValue(key: Ref<number>) {
    const { expandedInfo } = useExpandedInfo()
    return computed<boolean>({
        get() {
            return expandedInfo.value[key.value] ?? false
        },
        set(value) {
            expandedInfo.value[key.value] = value
        }
    })
}

export const [installDescriptionCache, useDescriptionCache] = installation(function() {

})

export function setColorForAllChildren(tag: TagTreeNode, color: string | null) {
    tag.color = color
    if(tag.children?.length) {
        for(const child of tag.children) {
            setColorForAllChildren(child, color)
        }
    }
}
