import { inject, InjectionKey, provide, Ref, ref } from "vue"
import { TagTreeNode } from "@/functions/adapter-http/impl/tag"
import { IndexedInfo, TagListContext, useTagListContext } from "@/functions/api/tag-tree/data"

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

/**
 * 辅助VCA：在更上层级注入，以在期望节点上缓存expandedInfo存储结构。
 * 不是必须使用的。如果不使用此方法，那么默认会在构建位置保存存储结构。
 */
export function installExpandedInfoStorage() {
    provide(expandedInfoInjection, ref<{[key: number]: boolean}>({}))
}

/**
 * 构建树节点的展开信息的存储结构。
 */
export function useExpandedInfo(context?: TagListContext): ExpandedInfoContext {
    const { indexedInfo } = context ?? useTagListContext()

    const expandedInfo = inject<Ref<{[key: number]: boolean}>>(expandedInfoInjection, () => ref({}), true)

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

const expandedInfoInjection: InjectionKey<Ref<{[key: number]: boolean}>> = Symbol()
