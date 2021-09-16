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

export interface ExpandedViewerController {
    /**
     * 将一个元素滚动到视野内。如果此元素被折叠，则先展开此元素的所有父元素。
     */
    scrollIntoView(key: number): void
}

export interface ExpandedViewerImpl {
    /**
     * 实现元素监听此target的变化，以得知此控制器的滚动目标通知。
     */
    target: Ref<number | null>
    /**
     * 向控制器汇报target的element，以通知跳转和事件完成。
     */
    targetImplement(el: Element | ComponentPublicInstance | null): void
}

export const [installExpandedInfo, useExpandedInfo] = installation(function(context?: TagListContext): ExpandedInfoContext {
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
})

export function useExpandedValue(key: Ref<number>) {
    const { get, set } = useExpandedInfo()
    return computed<boolean>({
        get: () => get(key.value),
        set: value => set(key.value, value)
    })
}

const [installExpandedViewerContext, useExpandedViewerContext] = installation(function(expandedInfo: ExpandedInfoContext): ExpandedViewerController & ExpandedViewerImpl {
    const target = ref<number | null>(null)

    return {
        target,
        async targetImplement(el: Element | ComponentPublicInstance | null) {
            await nextTick()
            if(typeof (el as any).scrollIntoView === "function") {
                (el as any).scrollIntoView({block: "nearest"})
            }
            target.value = null
        },
        scrollIntoView(key: number) {
            target.value = key
            expandedInfo.setAllForParent(key, true)
        }
    }
})

export { installExpandedViewerContext }

export function useExpandedViewer(): ExpandedViewerController {
    return useExpandedViewerContext()
}

export function useExpandedViewerImpl(): ExpandedViewerImpl {
    return useExpandedViewerContext()
}
