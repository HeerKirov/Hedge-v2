import { computed, defineComponent, ref, watch } from "vue"
import Select, { SelectItem } from "@/components/forms/Select"
import { SimpleAuthor, SimpleTopic, SimpleTag } from "@/functions/adapter-http/impl/all"
import { useHttpClient } from "@/functions/app"
import { objects } from "@/utils/primitives"
import { MetaTagSelectList } from "./Components"
import { usePanelContext } from "./inject"

export default defineComponent({
    setup() {
        const { selectList, suggestions } = useSuggestionItems()

        const selectedIndex = ref<number>(0)
        const selectedSuggestion = computed<{topics: SimpleTopic[], authors: SimpleAuthor[], tags: SimpleTag[]} | undefined>(() => suggestions.value[selectedIndex.value])

        return () => <>
            <div class="mx-1">
                <Select class="is-small" items={selectList.value} value={selectList.value[selectedIndex.value]?.value} onUpdateValue={(_, i) => selectedIndex.value = i}/>
            </div>
            <MetaTagSelectList topics={selectedSuggestion.value?.topics ?? []} authors={selectedSuggestion.value?.authors ?? []} tags={selectedSuggestion.value?.tags ?? []}/>
        </>
    }
})

function useSuggestionItems() {
    const httpClient = useHttpClient()
    const { identity } = usePanelContext()

    const selectList = ref<SelectItem[]>([])
    const suggestions = ref<{topics: SimpleTopic[], authors: SimpleAuthor[], tags: SimpleTag[]}[]>([])

    watch(identity, async (identity, old) => {
        if(identity !== null) {
            //确认首次执行，或identity实质未变
            if(old === undefined || !objects.deepEquals(identity, old)) {
                const res = await httpClient.metaUtil.suggest(identity)
                if(res.ok) {
                    selectList.value = res.data.map(r => {
                        if(r.type === "children") return {name: "关联的子项目", value: "children"}
                        else if(r.type === "associate") return {name: "关联组的相关项目", value: "associate"}
                        else if(r.type === "collection") return {name: `所属的图库集合 ${r.collectionId}`, value: "collection"}
                        else if(r.type === "album") return {name: `所属画集《${r.album.title}》`, value: `album-${r.album.id}`}
                        else throw Error(`Unsupported suggestion ${r}.`)
                    })
                    suggestions.value = res.data.map(r => ({topics: r.topics, tags: r.tags, authors: r.authors}))
                    return
                }else{
                    selectList.value = []
                    suggestions.value = []
                }
            }
        }else{
            selectList.value = []
            suggestions.value = []
        }
    }, {immediate: true})

    return {selectList, suggestions}
}
