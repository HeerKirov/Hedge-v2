import { ref, Ref, watch } from "vue"
import { TagTreeNode } from "@/functions/adapter-http/impl/tag"
import { TagListContext } from "@/functions/api/tag-tree/data"
import { installation } from "@/functions/utils/basic"

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

function condition(node: TagTreeNode, text: string) {
    return node.name.toLowerCase().includes(text) || node.otherNames.some(n => n.toLowerCase().includes(text))
}
