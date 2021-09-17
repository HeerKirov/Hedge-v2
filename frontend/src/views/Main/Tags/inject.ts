import { readonly, Ref, ref } from "vue"
import { TagTreeNode } from "@/functions/adapter-http/impl/tag"
import { installation } from "@/functions/utils/basic"
import { createPopupMenu, useLocalStorageWithDefault } from "@/functions/app"
import { installSearchService, installTagListContext, useTagListContext, useSearchService, TagListContext, IndexedInfo } from "@/functions/api/tag-tree"
import { installTagTreeContext, useTagTreeAccessor, TagTreeEventCallbackContext } from "@/layouts/data/TagTree"
export type { TagListContext, IndexedInfo }

export { installTagListContext, useTagListContext, installSearchService, useSearchService, useTagTreeAccessor }

export interface TagPaneContext {
    detailMode: Readonly<Ref<number | null>>
    createMode: Readonly<Ref<TagCreateTemplate | null>>
    searchMode: Readonly<Ref<boolean>>
    openCreatePane(template?: TagCreateTemplate): void
    openDetailPane(id: number): void
    openSearchPane(): void
    closePane(): void
}

export interface TagCreateTemplate {
    parentId?: number
    ordinal?: number
}

export const [installTagPaneContext, useTagPaneContext] = installation(function(): TagPaneContext {
    const detailMode = ref<number | null>(null)
    const createMode = ref<TagCreateTemplate | null>(null)
    const searchMode = ref(false)

    const openCreatePane = (template?: TagCreateTemplate) => {
        createMode.value = template ?? {}
        detailMode.value = null
        searchMode.value = false
    }

    const openDetailPane = (id: number) => {
        createMode.value = null
        detailMode.value = id
        searchMode.value = false
    }

    const openSearchPane = () => {
        createMode.value = null
        detailMode.value = null
        searchMode.value = true
    }

    const closePane = () => {
        createMode.value = null
        detailMode.value = null
        searchMode.value = false
    }

    return {
        detailMode: readonly(detailMode), createMode: readonly(createMode), searchMode: readonly(searchMode),
        openCreatePane, openDetailPane, openSearchPane, closePane
    }
})

const [installEditable, useEditable] = installation(function() {
    return useLocalStorageWithDefault<boolean>("tag-list/editable", false)
})

export { useEditable }

export function installLocalTagDataContext(tagPaneContext: TagPaneContext, tagListContext: TagListContext) {
    const editable = installEditable()
    const contextmenu = useContextmenu(tagPaneContext, tagListContext)

    installTagTreeContext({
        tagListContext,
        editable,
        click: tag => tagPaneContext.openDetailPane(tag.id),
        rightClick: contextmenu
    })

    return {tagPaneContext}
}

function useContextmenu({ detailMode, openDetailPane, openCreatePane, closePane }: TagPaneContext, { indexedInfo }: TagListContext) {
    const createChild = (id: number) => openCreatePane({parentId: id})
    const createBefore = (id: number) => {
        const info = indexedInfo.value[id]
        if(info) openCreatePane({parentId: info.parentId ?? undefined, ordinal: info.ordinal})
    }
    const createAfter = (id: number) => {
        const info = indexedInfo.value[id]
        if(info) openCreatePane({parentId: info.parentId ?? undefined, ordinal: info.ordinal + 1})
    }

    return (tag: TagTreeNode, context: TagTreeEventCallbackContext) => {
        async function deleteItem() {
            if(await context.deleteItem()) {
                if(detailMode.value === tag.id) {
                    closePane()
                }
            }
        }

        createPopupMenu([
            {type: "normal", label: "查看详情", click: openDetailPane},
            {type: "separator"},
            {type: "normal", label: "折叠全部标签", click: context.collapseItem},
            {type: "normal", label: "展开全部标签", click: context.expandItem},
            {type: "separator"},
            {type: "normal", label: "新建子标签", click: createChild},
            {type: "normal", label: "在此标签之前新建", click: createBefore},
            {type: "normal", label: "在此标签之后新建", click: createAfter},
            {type: "separator"},
            {type: "normal", label: "删除此标签", click: deleteItem}
        ])(undefined, tag.id)
    }
}
