import { ComponentPublicInstance, computed, nextTick, Ref, ref } from "vue"
import { TagTreeNode } from "@/functions/adapter-http/impl/tag"
import { IndexedInfo, TagListContext, useTagListContext } from "@/functions/api/tag-tree/data"
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
     * 设定当前节点的父节点的折叠状态。
     */
    setAllForParent(key: number, value: boolean): void
    /**
     * 设定当前节点及其所有子节点的折叠状态。
     */
    setAllForChildren(key: number, value: boolean): void
}

export function useExpandedInfo(context?: TagListContext): ExpandedInfoContext {
    const { indexedInfo } = context ?? useTagListContext()

    const expandedInfo = ref<{[key: number]: boolean}>({})

    const get = (key: number): boolean => expandedInfo.value[key] ?? false

    const set = (key: number, value: boolean) => expandedInfo.value[key] = value

    const setAllForParent = (key: number, value: boolean) => {
        const deepSet = (tag: IndexedInfo, value: boolean) => {
            set(tag.tag.id, value)
            if(tag.parentId) {
                const p = indexedInfo.value[tag.parentId]
                if(p) deepSet(p, value)
            }
        }

        const info = indexedInfo.value[key]
        if(info && info.parentId) {
            const p = indexedInfo.value[info.parentId]
            if(p) deepSet(p, value)
        }
    }

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

    return {get, set, setAllForParent, setAllForChildren}
}
