import { computed, Ref, ref, watch } from "vue"
import { TagTreeNode } from "@/functions/adapter-http/impl/tag"
import { installation } from "@/functions/utils/basic"
import { TagListContext, useTagListContext } from "./data"

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

export const [installExpandedInfo, useExpandedInfo] = installation(function(context?: TagListContext): ExpandedInfoContext {
    const { indexedInfo } = context ?? useTagListContext()

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

export interface SearchService {
    result: Ref<SearchResultItem[]>,
    searchText: Ref<string | null | undefined>
}

export interface SearchResultItem {
    id: number
    color: string | null
    address: string
}

export const [installSearchService, useSearchService] = installation(function({ data }: TagListContext): SearchService {
    const searchText = ref<string | null>()

    const result = ref<SearchResultItem[]>([])

    function condition(node: TagTreeNode, text: string) {
        return node.name.toLowerCase().includes(text) || node.otherNames.some(n => n.toLowerCase().includes(text))
    }

    const search = (text: string) => {
        const trimText = text.trim().toLowerCase()
        if(trimText) {
            const ret: SearchResultItem[] = []

            function searchInNode(node: TagTreeNode, parentAddress: string | null) {
                const address = parentAddress !== null ? `${parentAddress}.${node.name}` : node.name
                if(condition(node, trimText)) {
                    //当前节点满足搜索条件
                    ret.push({
                        id: node.id,
                        color: node.color,
                        address
                    })
                }
                if(node.children?.length) {
                    for(const child of node.children) {
                        searchInNode(child, address)
                    }
                }
            }

            for(const rootNode of data.value) {
                searchInNode(rootNode, null)
            }

            result.value = ret
        }else{
            result.value = []
        }
    }

    watch(searchText, text => search(text ?? ""))

    return {searchText, result}
})
