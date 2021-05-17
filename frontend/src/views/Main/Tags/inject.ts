import { onMounted, readonly, Ref, ref, watch } from "vue"
import { TagTreeNode } from "@/functions/adapter-http/impl/tag"
import { useNotification } from "@/functions/module"
import { useHttpClient } from "@/functions/app"
import { installation } from "@/functions/utils/basic"

export interface TagContext {
    loading: Ref<boolean>
    data: Ref<TagTreeNode[]>
    detailMode: Ref<number | null>
    openDetailPane(id: number): void
    closePane(): void
}

export const [installTagContext, useTagContext] = installation(function(): TagContext {
    const tagTree = useTagTree()

    const pane = usePane()

    return {...tagTree, ...pane}
})

function useTagTree() {
    const httpClient = useHttpClient()
    const { handleException } = useNotification()

    const loading = ref(true)
    const data = ref<TagTreeNode[]>([])

    const refresh = async () => {
        loading.value = true
        const res = await httpClient.tag.tree({})
        if(res.ok) {
            data.value = res.data
        }else if(res.exception) {
            handleException(res.exception)
        }
        loading.value = false
    }

    onMounted(refresh)

    return {loading, data}
}

function usePane() {
    const detailMode = ref<number | null>(null)

    const openDetailPane = (id: number) => {
        detailMode.value = id
    }

    const closePane = () => {
        detailMode.value = null
    }

    return {detailMode, openDetailPane, closePane}
}