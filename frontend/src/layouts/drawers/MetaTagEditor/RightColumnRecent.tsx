import { defineComponent, onBeforeMount, ref, watch } from "vue"
import Select, { SelectItem } from "@/components/forms/Select"
import { MetaUtilIdentity, MetaUtilResult } from "@/functions/adapter-http/impl/util-meta"
import { IdentityType } from "@/functions/adapter-http/impl/generic"
import { useHttpClient } from "@/services/app"
import { MetaTagSelectList } from "./Components"
import { usePanelContext } from "./inject"

export default defineComponent({
    setup() {
        const { selectList, selected, selectedMetas } = useRecentItems()

        return () => <>
            <div class="mx-1">
                <Select class="is-small" items={selectList.value} value={selected.value} onUpdateValue={v => selected.value = v}/>
            </div>
            <MetaTagSelectList {...selectedMetas.value}/>
        </>
    }
})

function useRecentItems() {
    const httpClient = useHttpClient()
    const { identity } = usePanelContext()

    const identities: MetaUtilIdentity[] = []
    const selectList = ref<SelectItem[]>([
        {name: "元数据标签使用历史", value: "recent"},
        {name: "经常使用的元数据标签", value: "frequent"}
    ])

    onBeforeMount(async () => {
        //查询identity编辑历史
        const res = await httpClient.metaUtil.history.identities.list()
        if(res.ok) {
            identities.push(...res.data)
            const identityList = res.data
                .filter(({ type, id }) => !(type === identity.value?.type && id === identity.value?.id)) //从记录中过滤掉自己
                .map(({ type, id }) => ({name: `${type === "IMAGE" ? "图库项目" : type === "COLLECTION" ? "图库集合" : "画集"} ${id}`, value: `${type}-${id}`}))
            selectList.value.push(...identityList)
        }
    })

    const selected = ref<"frequent" | "recent" | `${IdentityType}-${number}`>("recent")
    const selectedMetas = ref<MetaUtilResult>({authors: [], topics: [], tags: []})

    watch(selected, async () => {
        if(selected.value === "frequent") {
            const res = await httpClient.metaUtil.history.metaTags.frequent()
            if(res.ok) selectedMetas.value = res.data
            else selectedMetas.value = {authors: [], topics: [], tags: []}
        }else if(selected.value === "recent") {
            const res = await httpClient.metaUtil.history.metaTags.recent()
            if(res.ok) selectedMetas.value = res.data
            else selectedMetas.value = {authors: [], topics: [], tags: []}
        }else{
            const [type, id] = selected.value.split("-", 2)
            const res = await httpClient.metaUtil.history.identities.get({type: type as IdentityType, id: parseInt(id)})
            if(res.ok) selectedMetas.value = res.data
            else selectedMetas.value = {authors: [], topics: [], tags: []}
        }
    }, {immediate: true})

    return {identities, selectList, selected, selectedMetas}
}
