import { computed, readonly, Ref, ref } from "vue"
import { installation } from "@/functions/utils/basic"
import { useLocalStorageWithDefault } from "@/functions/app"
import { useTagListContext } from "@/functions/api/tag-tree"
export {
    installTagListContext, installExpandedInfo, installSearchService, installExpandedViewerContext, useExpandedInfo,
    useTagListContext, useExpandedViewer, useExpandedViewerImpl, useSearchService, useExpandedValue
} from "@/functions/api/tag-tree"
export type { TagListContext, IndexedInfo, ExpandedInfoContext } from "@/functions/api/tag-tree"

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

export const [installEditLock, useEditLock] = installation(function() {
    return useLocalStorageWithDefault<boolean>("tag-list/edit-lock", false)
})

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
