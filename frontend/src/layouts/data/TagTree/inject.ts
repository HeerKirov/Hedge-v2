import { computed, inject, InjectionKey, isRef, provide, ref, Ref } from "vue"
import { TagTreeNode } from "@/functions/adapter-http/impl/tag"
import { TagListContext, useTagListContext } from "@/functions/api/tag-tree"
import { useMessageBox } from "@/functions/module/message-box"
import { useDroppable } from "@/functions/feature/drag"
import { ExpandedInfoContext, useExpandedInfo } from "./inject-expand"
import { ElementRefContext, useElementRefContext } from "./inject-ref"

interface TagTreeContext {
    tagListContext: TagListContext
    isEditable: Ref<boolean> | boolean
    isDraggable(tag: TagTreeNode): boolean
    event: {
        click(tag: TagTreeNode, e: MouseEvent)
        rightClick(tag: TagTreeNode, e: MouseEvent)
    },
    isCursorPointer: boolean
    expandedInfo: ExpandedInfoContext
    elementRef: ElementRefContext
}

export interface TagTreeEventCallbackContext {
    expandItem(): void
    collapseItem(): void
    deleteItem(): Promise<boolean>
}

export interface TagTreeAccessor {
    scrollIntoView: ElementRefContext["scrollIntoView"]
}

interface InstallTagTreeContext {
    /**
     * 安装数据源。
     */
    tagListContext: TagListContext
    /**
     * 是否可编辑。可编辑指可通过拖放来编辑位置。
     */
    editable?: Ref<boolean> | boolean
    /**
     * 判断每个标签是否可拖拽。如果未提供此选项，那么按editable的值来。
     */
    draggable?(tag: TagTreeNode): boolean
    /**
     * 是否显示选择指针。
     * 不指定此参数时，此参数的值与click的存在与否挂钩。
     */
    isCursorPointer?: boolean
    /**
     * 单击时发生的事件。
     */
    click?(tag: TagTreeNode, context: TagTreeEventCallbackContext, e: MouseEvent)
    /**
     * 右键单击时发生的事件。
     */
    rightClick?(tag: TagTreeNode, context: TagTreeEventCallbackContext, e: MouseEvent)
}

const tagTreeContextInjectionKey: InjectionKey<TagTreeContext> = Symbol()

/**
 * 在上层公共组件安装完整的tag tree数据管理上下文。
 */
export function installTagTreeContext(context: InstallTagTreeContext) {
    const messageBox = useMessageBox()
    const expandedInfo = useExpandedInfo(context.tagListContext)
    const elementRef = useElementRefContext(expandedInfo)
    const editable = context.editable
    const isEditable = isRef(editable) ? editable : editable ?? false
    const isDraggable = context.draggable ?? (isRef(editable) ? (() => editable.value) : editable ? (() => true) : (() => false))
    const isCursorPointer = context.isCursorPointer ?? !!context.click

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
        isEditable,
        isDraggable,
        event: {
            click(tag: TagTreeNode, e: MouseEvent) {
                if(context.click) {
                    context.click(tag, createEventContext(tag), e)
                }
            },
            rightClick(tag: TagTreeNode, e: MouseEvent) {
                if(context.rightClick) {
                    context.rightClick(tag, createEventContext(tag), e)
                }
            }
        },
        isCursorPointer,
        expandedInfo,
        elementRef
    })
}

/**
 * 提供给外部，提供对tag tree的控制访问能力。
 */
export function useTagTreeAccessor(): TagTreeAccessor {
    const { elementRef } = useTagTreeContext()

    return {
        scrollIntoView: elementRef.scrollIntoView
    }
}

/**
 * use完整的tag tree数据管理上下文。
 */
export function useTagTreeContext(): TagTreeContext {
    return inject(tagTreeContextInjectionKey)!!
}

/**
 * 提供给RootNode，use一项description信息，与id挂钩。
 */
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

/**
 * use一项expand info的状态，与id挂钩。
 */
export function useExpandedValue(key: Ref<number>) {
    const { get, set } = useTagTreeContext().expandedInfo
    return computed<boolean>({
        get: () => get(key.value),
        set: value => set(key.value, value)
    })
}

/**
 * use包装过的droppableBy，完整实现了拖放后移动的功能。
 */
export function useTagDrop(parentId: Ref<number | null>, ordinal: Ref<number | null> | null) {
    const messageBox = useMessageBox()
    const { tagListContext: { fastEndpoint, data, indexedInfo, syncMoveTag }, isEditable } = useTagTreeContext()

    function getTarget(currentParentId: number | null, currentOrdinal: number, insertParentId: number | null, insertOrdinal: number | null): {parentId: number | null, ordinal: number} {
        if(insertOrdinal === null) {
            //省略insert ordinal表示默认操作
            if(currentParentId === insertParentId) {
                //parent不变时的默认操作是不移动
                return {parentId: insertParentId, ordinal: currentOrdinal}
            }else{
                //parent变化时的默认操作是移动到列表末尾，此时需要得到列表长度
                const count = insertParentId !== null ? (indexedInfo.value[insertParentId]!.tag.children?.length ?? 0) : data.value.length
                return {parentId: insertParentId, ordinal: count}
            }
        }else{
            if(currentParentId === insertParentId && insertOrdinal > currentOrdinal) {
                //目标parentId保持不变
                //插入的位置在当前位置之后，这符合开头描述的特殊情况，因此发送给API的ordinal需要调整
                return {parentId: insertParentId, ordinal: insertOrdinal - 1}
            }else{
                return {parentId: insertParentId, ordinal: insertOrdinal}
            }
        }
    }

    /**
     * 将指定的节点移动到标定的插入位置。
     * @param sourceId 指定节点的tag id。
     * @param insertParentId 插入目标节点的id。null表示插入到根列表。
     * @param insertOrdinal 插入目标节点后的排序顺位。null表示默认操作(追加到节点末尾，或者对于相同parent不执行移动)
     */
    const move = (sourceId: number, insertParentId: number | null, insertOrdinal: number | null) => {
        //需要注意的是，前端的insert(parent, ordinal)含义与API的target(parent, ordinal)并不一致。
        //API的含义是"移动到此目标位置"，也就是移动后的ordinal保证与给出的一致(除非超过最大值)。
        //而前端的含义则是"插入到此目标之前"。与API相比，在parent不变、移动到靠后的位置时，调API的位置实际上要-1。

        const info = indexedInfo.value[sourceId]
        if(!info) {
            console.error(`Error occurred while moving tag ${sourceId}: cannot find indexed info.`)
            return
        }
        const target = getTarget(info.parentId, info.ordinal, insertParentId, insertOrdinal)

        if(target.parentId === info.parentId && target.ordinal === info.ordinal || sourceId === target.parentId) {
            //没有变化，或插入目标是其自身时，跳过操作
            return
        }

        //如果parentId不变，则将其摘出参数
        const form = target.parentId === info.parentId ? {ordinal: target.ordinal} : target

        fastEndpoint.setData(sourceId, form, e => {
            if(e.code === "RECURSIVE_PARENT") {
                messageBox.showOkMessage("prompt", "无法移动到此位置。", "无法将标签移动到其子标签下。")
            }else{
                return e
            }
        }).then(ok => {
            if(ok) syncMoveTag(sourceId, target.parentId, target.ordinal)
        })
    }

    if(isRef(isEditable)) {
        const { isDragover: originIsDragover, ...dropEvents } = useDroppable("tag", tag => {
            if(isEditable.value) {
                move(tag.id, parentId.value, ordinal?.value ?? null)
            }
        })
        const isDragover: Ref<boolean> = computed(() => isEditable.value && originIsDragover.value)

        return {isDragover, ...dropEvents}

    }else if(isEditable) {
        return useDroppable("tag", tag => move(tag.id, parentId.value, ordinal?.value ?? null))

    }else{
        return {isDragover: ref(false)}
    }
}
