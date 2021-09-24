import { computed, reactive, readonly, watch } from "vue"
import { SourceTag } from "@/functions/adapter-http/impl/illust"
import { installation } from "@/functions/utils/basic"
import { useDetailViewContext, useOriginDataEndpoint } from "../../inject"

export const [installEditorData, useEditorData] = installation(function() {
    const { ui: { drawerTab } } = useDetailViewContext()
    const { data, setData } = useOriginDataEndpoint()

    const editorData = reactive<{
        title: string,
        description: string,
        tags: SourceTag[],
        pools: string[],
        children: number[],
        parents: number[]
    }>({
        title: "",
        description: "",
        tags: [],
        pools: [],
        children: [],
        parents: []
    })
    const changed = reactive({title: false, description: false, tags: false, pools: false, children: false, parents: false})

    watch(data, d => {
        editorData.title = d?.title ?? ""
        editorData.description = d?.description ?? ""
        editorData.tags = d?.tags ? [...d.tags] : []
        editorData.pools = d?.pools ? [...d.pools] : []
        editorData.children = d?.children ? [...d.children] : []
        editorData.parents = d?.parents ? [...d.parents] : []
        changed.title = false
        changed.description = false
        changed.tags = false
        changed.pools = false
        changed.children = false
        changed.parents = false
    }, {immediate: true})

    function set<K extends keyof (typeof editorData)>(key: K, value: (typeof editorData)[K]) {
        editorData[key] = value
        changed[key] = true
    }

    const canSave = computed(() => changed.title || changed.description || changed.tags || changed.parents || changed.children || changed.pools)

    const save = async () => {
        if(canSave.value) {
            const ok = await setData({
                title: changed.title ? editorData.title ?? null : undefined,
                description: changed.description ? editorData.description ?? null : undefined,
                tags: changed.tags ? editorData.tags : undefined,
                pools: changed.pools ? editorData.pools : undefined,
                children: changed.children ? editorData.children : undefined,
                parents: changed.parents ? editorData.parents : undefined
            })

            if(ok) {
                //保存成功后关闭面板
                drawerTab.value = undefined
            }
        }
    }

    return {data: readonly(editorData), set, save, canSave}
})
