import { computed, Ref, ref } from "vue"
import { TagTreeNode } from "@/functions/adapter-http/impl/tag"
import { TagListContext, useTagListContext } from "@/functions/api/tag-tree/data"
import { installation } from "@/functions/utils/basic"

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
