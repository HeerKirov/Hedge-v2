import { readonly, Ref, ref } from "vue"
import { installation } from "@/functions/utils/basic"
export { installExpandedInfo, installEditLock, installSearchService, useEditLock, useSearchService, useExpandedValue } from "./inject-state"
export { installTagListContext, useTagListContext, useDescriptionValue } from "./inject-data"
export type { ExpandedInfoContext } from "./inject-state"
export type { TagListContext, IndexedInfo } from "./inject-data"

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
