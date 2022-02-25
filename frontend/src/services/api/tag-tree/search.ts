import { ref, Ref, watch } from "vue"
import { IsGroup, TagTreeNode, TagType } from "@/functions/adapter-http/impl/tag"
import { installation } from "@/functions/utils/basic"
import { TagListContext } from "./data"

export interface SearchService {
    result: Ref<TagAddress[]>,
    searchText: Ref<string | null | undefined>
}

export interface TagAddress {
    id: number
    address: {name: string, group: IsGroup}[]
    type: TagType
    color: string | null
}

export const [installSearchService, useSearchService] = installation(function({ data }: TagListContext): SearchService {
    const searchText = ref<string | null>()

    const result = ref<TagAddress[]>([])

    const search = (text: string) => {
        const trimText = text.trim().toLowerCase()
        if(trimText) {
            const ret: TagAddress[] = []

            function searchInNode(node: TagTreeNode, parents: TagTreeNode[] | null) {
                const nodes = parents !== null ? [...parents, node] : [node]
                if(condition(node, trimText)) {
                    //当前节点满足搜索条件
                    ret.push({
                        id: node.id,
                        color: node.color,
                        type: node.type,
                        address: nodes.map(n => ({name: n.name, group: n.group}))
                    })
                }
                if(node.children?.length) {
                    for(const child of node.children) {
                        searchInNode(child, nodes)
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
