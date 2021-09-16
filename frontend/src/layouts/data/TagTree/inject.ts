import { computed, inject, InjectionKey, provide, Ref, unref } from "vue"
import { TagTreeNode } from "@/functions/adapter-http/impl/tag"
import { TagListContext, useTagListContext } from "@/functions/api/tag-tree"
import { useMessageBox } from "@/functions/document/message-box"
import { ExpandedInfoContext, useExpandedInfo } from "./inject-expand"
import { ElementRefContext, useElementRefContext } from "./inject-ref"

interface TagTreeContext {
    tagListContext: TagListContext
    isEditable(): boolean
    event: {
        click(tag: TagTreeNode)
        rightClick(tag: TagTreeNode)
    },
    expandedInfo: ExpandedInfoContext
    elementRef: ElementRefContext
}

interface TagTreeEventCallbackContext {
    expandItem(): void
    collapseItem(): void
    deleteItem(): Promise<boolean>
}

interface InstallTagTreeContext {
    tagListContext: TagListContext
    editable?: Ref<boolean> | boolean
    click?(tag: TagTreeNode, context: TagTreeEventCallbackContext)
    rightClick?(tag: TagTreeNode, context: TagTreeEventCallbackContext)
}

const tagTreeContextInjectionKey: InjectionKey<TagTreeContext> = Symbol()

export function installTagTreeContext(context: InstallTagTreeContext) {
    const messageBox = useMessageBox()
    const expandedInfo = useExpandedInfo(context.tagListContext)
    const elementRef = useElementRefContext(expandedInfo)

    function createEventContext(tag: TagTreeNode): TagTreeEventCallbackContext {
        return {
            expandItem() {
                expandedInfo.setAllForChildren(tag.id, true)
            },
            collapseItem() {
                expandedInfo.setAllForChildren(tag.id, false)
            },
            async deleteItem() {
                const info = context.tagListContext.indexedInfo.value[tag.id]
                if(info) {
                    const hasChildren = !!info.tag.children?.length
                    if(await messageBox.showYesNoMessage("warn", "确定要删除此项吗？", hasChildren ? "此操作将级联删除从属的所有子标签，且不可撤回。" : "此操作不可撤回。")) {
                        await context.tagListContext.fastEndpoint.deleteData(tag.id)
                        context.tagListContext.syncDeleteTag(tag.id)
                        return true
                    }
                }
                return false
            }
        }
    }

    provide(tagTreeContextInjectionKey, {
        tagListContext: context.tagListContext,
        isEditable() {
            return unref(context.editable) ?? false
        },
        event: {
            click(tag: TagTreeNode) {
                if(context.click) {
                    context.click(tag, createEventContext(tag))
                }
            },
            rightClick(tag: TagTreeNode) {
                if(context.rightClick) {
                    context.rightClick(tag, createEventContext(tag))
                }
            }
        },
        expandedInfo,
        elementRef
    })
}

export function useTagTreeContext(): TagTreeContext {
    return inject(tagTreeContextInjectionKey)!!
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

export function useExpandedValue(key: Ref<number>) {
    const { get, set } = useTagTreeContext().expandedInfo
    return computed<boolean>({
        get: () => get(key.value),
        set: value => set(key.value, value)
    })
}
